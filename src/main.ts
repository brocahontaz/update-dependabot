import * as core from "@actions/core"
import fs from "fs/promises"
import { glob } from "glob"
import YAML from "yaml"
import path from "path"
import {
  GitHubDependabotV2Config2,
  PackageEcosystem,
  PackageEcosystemValues,
  ScheduleInterval,
} from "./DependabotTypes"

const DEPENDABOT_FILE = "./.github/dependabot.yml"

const getDependabotFile = async () => {
  let file

  try {
    file = await fs.readFile(DEPENDABOT_FILE)

    return file
  } catch (error) {
    file = `
  version: 2
  updates: []
  registries: {}`

    return file
  }
}

const extractPaths = async (list: string[]) => {
  const files = await glob(list, { dot: true })
  const paths = [...new Set(files.map((file) => path.dirname(file)))]

  return paths
}

const getPaths = async (type: string) => {
  const input: string = core.getInput(type)

  if (input != "") {
    const inputList: string[] = input.split(",")
    const paths = await extractPaths(inputList)
    return paths
  }

  return []
}

const buildConfigs = async (
  paths: string[],
  ecosystem: PackageEcosystemValues,
  registries: string,
  schedule: ScheduleInterval,
): Promise<PackageEcosystem[]> => {
  const configs: PackageEcosystem[] = paths.map((path) => ({
    "package-ecosystem": `${ecosystem}`,
    directory: `${path != "." ? path : ""}/`,
    ...(registries && {
      registries: registries == "*" ? registries : [registries],
    }),
    schedule: { interval: `${schedule}` },
  }))

  configs.sort((a, b) => {
    return a.directory.toLocaleLowerCase() < b.directory.toLocaleLowerCase()
      ? -1
      : 1
  })

  return configs
}

const parseRegistries = async (registries: string) => {
  const registriesYAML = registries != "" ? YAML.parse(registries) : {}

  return registriesYAML
}

export async function run(): Promise<void> {
  try {
    const dependabotFile = await getDependabotFile()
    const currentDocument = YAML.parseDocument(dependabotFile.toString())
    const state = currentDocument.toJS() as GitHubDependabotV2Config2

    const npmPaths: string[] = await getPaths("npm-paths")
    const actionPaths: string[] = await getPaths("action-paths")
    const tfPaths: string[] = await getPaths("tf-paths")

    console.log("Extracted npm paths", npmPaths)
    console.log("Extracted action paths", actionPaths)
    console.log("Extracted terraform paths", tfPaths)

    const registries = core.getInput("registries")
    const registriesConfig = await parseRegistries(registries)

    const npmConfigs = await buildConfigs(
      npmPaths,
      "npm",
      "",
      core.getInput("npm-schedule") as ScheduleInterval,
    )

    const actionConfigs = await buildConfigs(
      actionPaths,
      "github-actions",
      "",
      core.getInput("action-schedule") as ScheduleInterval,
    )

    const tfConfigs = await buildConfigs(
      tfPaths,
      "terraform",
      core.getInput("tf-registries"),
      core.getInput("tf-schedule") as ScheduleInterval,
    )

    const generatedConfigs: PackageEcosystem[] = [
      ...npmConfigs,
      ...actionConfigs,
      ...tfConfigs,
    ]
    const currentConfigs = [...state.updates]

    const managedEcosystems: PackageEcosystemValues[] = [
      "npm",
      "github-actions",
      "terraform",
    ]

    const updatedConfigs = currentConfigs.reduce((acc, current) => {
      if (
        !managedEcosystems.includes(
          current["package-ecosystem"] as PackageEcosystemValues,
        )
      ) {
        return acc.concat(current)
      }

      const generated = generatedConfigs.find(
        (generated) => generated.directory === current.directory,
      )

      // Generated source has been removed, lets auto remove it
      if (!generated) {
        return acc
      }

      // Shallow merge the current one with the generated one
      return acc.concat({ ...current, ...generated })
    }, [] as PackageEcosystem[])

    state.updates = updatedConfigs
    state.registries = registriesConfig

    const newDocument = new YAML.Document(state)
    await fs.writeFile(DEPENDABOT_FILE, String(newDocument))
  } catch (error) {
    console.error(error)
  }
}
