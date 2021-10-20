import type { AddAllOptions } from 'ipfs-core-types/src/root'
import { create, globSource, IPFSHTTPClient as IpfsHttpClient } from 'ipfs-http-client'
import { resolve } from 'path'
import { promisify } from 'util'

const exec = promisify(require('child_process').exec)
const exists = promisify(require('fs').exists)


let ipfsClient: IpfsHttpClient | null = null

interface AddedFiles {
  cid: string;
  path: string;
  size: number;
}

export const ipfsOptions: AddAllOptions = {
  cidVersion: 1,
  wrapWithDirectory: true, // This is important when adding with the httpClient. it behaves differently than the cli where cli will wrap it in the name of the dir, this doesn't do that
  // hashAlg: "blake2b-256",
  progress: (bytes: number, path: string) => {
    console.log(path, bytes)
  },
  pin: false,
}

export function createIPFSConnection() {
  if (ipfsClient) {
    return ipfsClient
  }

  ipfsClient = create({
    host: '148.251.85.11',
    port: 32_212,
  })

  return ipfsClient
}

async function addViaAddAll(path: string, extraOptions?: AddAllOptions) {
  const client = createIPFSConnection()
  const addedFiles: AddedFiles[] = []
  console.time('uploadViaAddAll')
  for await (const file of client.addAll(
    globSource(path, '**/*', {
      hidden: true,
    }),
    { ...ipfsOptions, fileImportConcurrency: 50, ...extraOptions },
  )) {
    addedFiles.push({
      cid: file.cid.toString(),
      path: file.path,
      size: file.size,
    })
  }

  console.log(addedFiles)
  console.timeEnd('uploadViaAddAll')
  console.log('-------------------------')

}

async function addViaNativeIpfs(path: string, wrapWithDirectory?: boolean) {
  const execOptions = {
    cwd: path,
    stdio: [0, 1, 2],
  }

  const wrapCmd = wrapWithDirectory ? '--wrap-with-directory' : ''
  console.time('uploadViaNative')
  const res = await exec(`ipfs add --cid-version=1 -r  ${wrapCmd} .`, execOptions)
  console.log(res.stdout)
  console.timeEnd('uploadViaNative')
  console.log('-------------------------')

}

async function main() {
  const path = resolve(__dirname, '../upload-this')
  await addViaAddAll(path)
  await addViaNativeIpfs(path, true)
}

main().catch(console.error)
