function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader() // using file reader api
        reader.onload = () => resolve(reader.result) // if reader works call resolve
        reader.onerror = () => reject(reader.error) // if reader fails call reject
        reader.readAsArrayBuffer(file)
    })
}

function transformBytes(buffer) {
    const bytes = new Uint8Array(buffer)
    const result = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) {
        const n = bytes[i]
        const op = Math.floor(Math.random() * 4)
        
        switch (op) {
            case 0:
                result[i] = ~n &0xFF
                break
            case 1:
                result[i] = n ^ 0xAA
                break
            case 2:
                result[i] = ((n << 3) | (n >> 5)) & 0xFF
                break
            case 3:
                result[i] = ((n >> 1) ^ (n << 2)) & 0xFF
                break
        }
    }
    return result
}

function render(trans_bytes) {
    const side = Math.floor(Math.sqrt(trans_bytes.length / 4))
    const canvas = document.createElement("canvas")
    canvas.width = side
    canvas.height = side
    const c = canvas.getContext("2d")
    const image_buffer = c.createImageData(side, side)
    image_buffer.data.set(trans_bytes.subarray(0, side * side * 4))
    c.putImageData(image_buffer, 0, 0)
    return canvas
}

function playAsAudio(trans_bytes) {
    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE })
    const audioBuffer = audioCtx.createBuffer(1, trans_bytes.length, SAMPLE_RATE)
    const channel = audioBuffer.getChannelData(0)
    for (let i = 0; i < trans_bytes.length; i++) {
        channel[i] = (trans_bytes[i] - 128) / 128
    }

    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.loop = true // your creative decision lives here
    source.connect(audioCtx.destination)
    source.start()
}  


// MAIN SECTION
const SAMPLE_RATE = Math.floor(22050 + Math.random() * 22050) // play around with this
let SCALE = 1
let sourceCanvas = null
let audio = null

// get HTML elements
const bgCanvas = document.getElementById("bg")
const uploadBt = document.getElementById("upload-btn")
const fileInpt = document.getElementById("file-input")
const startscreen = document.getElementById("start-screen")

// event listner for upload button
uploadBt.addEventListener("click", () => {
    fileInpt.click()
})

// function that once file is uploaded, starts everything
fileInpt.addEventListener("change", async (event) => {
    const file = event.target.files[0]
    if (!file) return // protect against empty files / nothing selected
    const buffer = await readFile(file)
    const trans_bytes = transformBytes(buffer)
    sourceCanvas = render(trans_bytes)
    playAsAudio(trans_bytes)
    tessellate()
    startscreen.remove()
})

function tessellate() {
    if (!sourceCanvas) return
    const tile_size = sourceCanvas.width * SCALE
    const bgCanvas = document.getElementById("bg")
    bgCanvas.width = window.innerWidth
    bgCanvas.height = window.innerHeight
    const c = bgCanvas.getContext("2d")

    for (let y = 0; y <= window.innerHeight; y+= tile_size) {
        for (let x = 0; x <= window.innerWidth; x += tile_size) {
            c.drawImage(sourceCanvas, x, y, tile_size, tile_size)
        }
    }
}
window.addEventListener("resize", tessellate)

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        SCALE += .05
    }
    if (event.key === "ArrowDown") {
        SCALE -= .05
    }
    if (event.key === "ArrowUp" && event.shiftKey) {
        SCALE += 3
    }
    if (event.key === "ArrowDown" && event.shiftKey) {
        SCALE -= 3
    }
    if (SCALE <=  0.5) {
        SCALE = Math.max(SCALE, 0.5)
    }
    tessellate()
})