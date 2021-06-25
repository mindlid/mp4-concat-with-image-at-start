import { resolve, join } from 'path'
import { readdirSync } from 'fs'
import { execSync } from 'child_process'

const root = resolve('./')
const imageFolderPath = `${root}/input/image`
const imagePath = `${imageFolderPath}/image.png`
const imageVideoPath = `${imageFolderPath}/image.mp4`
const imageStreamPath = `${imageFolderPath}/image.ts`
const videInputPath = `${root}/input/video/`

async function main() {
    const videoFolderPaths = readdirSync(videInputPath).map(dir => `${videInputPath}/${dir}`)
    console.log(videoFolderPaths)
    const videoPaths = videoFolderPaths
        .reduce((map, dir) => map.set(dir, readdirSync(dir)),
            new Map<string, string[]>())

    //convert image to video
    const framerate = 8
    const time = 2
    execSync(`ffmpeg -loop 1 -framerate ${framerate} -i ${imagePath} -c:v libx264 -t ${time} -pix_fmt yuv420p ${imageVideoPath} -y`)
    //convert to MPEG-2 transport stream
    execSync(`ffmpeg -i ${imageVideoPath} -c copy -bsf:v h264_mp4toannexb -f mpegts ${imageStreamPath} -y`)

    Array.from(videoPaths.entries()).forEach(([videoFolderPath, videoPaths]) => {

        videoPaths.forEach(videoPath => {
            const videoName = videoPath.replace(/\.[^/.]+$/, "")
            const videoStreamPath = `output/temp/${videoName}.ts`
            const videoOutputPath = `output/videos/${videoName}.mp4`
            console.log(videoName)

            execSync(`ffmpeg -i ${videoFolderPath}/${videoPath} -c copy -bsf:v h264_mp4toannexb -f mpegts ${videoStreamPath} -y`)
            execSync(`ffmpeg -i "concat:${imageStreamPath}|${videoStreamPath}" -c copy -bsf:a aac_adtstoasc ${videoOutputPath} -y`)
        })
    })
}

main().then(() => console.log('done'))

