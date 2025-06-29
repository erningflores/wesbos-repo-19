const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');

function getVideo(){
    navigator.mediaDevices.getUserMedia({video: true, audio: false}).then(localMediaStream => {
        console.log(localMediaStream);
        video.srcObject = localMediaStream;
        video.play();
    }).catch(err => {
        console.error(`OH NO!!!`, err);
    });
}

function paintToCanvas(){
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

   // video.style.display = 'none';

    return setInterval(() => {
        ctx.drawImage(video, 0, 0, width, height);
        let pixels = ctx.getImageData(0, 0, width, height);
        pixels = rgbSplit(pixels);
        ctx.putImageData(pixels, 0, 0);
    }, 16);
}

function takePhoto(){
    snap.currentTime = 0;
    snap.play();

    if (canvas.width === 0 || canvas.height === 0) {
        console.warn("Canvas dimensions are zero, cannot take photo.");
        return;
    }

    const data = canvas.toDataURL('image/jpeg');
     console.log("Captured image data URL length:", data.length); // Should be a long string
    if (data.length < 1000) { // Very short data URL likely means an empty canvas
        console.warn("Captured data URL is unusually short, canvas might be empty.");
    }

    const link = document.createElement('a');
    link.href = data;
    link.setAttribute('download', 'photobooth-image');
    link.innerHTML = `<img src="${data}" alt="Captured Image" />`;

    console.log("Created link element:", link);
    console.log("Image element inside link:", link.querySelector('img'));
    console.log("Strip element:", strip);

    strip.insertBefore(link, strip.firstChild);

    setTimeout(() => {
        strip.style.border = 'none'; // Or revert to original border
    }, 500);
}

function redEffect(pixels){
    for(let i=0; i<pixels.data.length; i+=4){
        pixels.data[i + 0] = pixels.data[i + 0] + 200; //red
        pixels.data[i + 1] = pixels.data[i + 1] - 50; // green
        pixels.data[i + 2] = pixels.data[i + 2] * 0.5; //blue
    }
    return pixels;
}

function rgbSplit(pixels){
    let outputPixels = new ImageData(pixels.width, pixels.height);
    const originalData = new Uint8ClampedArray(pixels.data);

    for(let i=0; i<pixels.data.length; i+=4){
        const redIndex = i + 0;
        const greenIndex = i + 1;
        const blueIndex = i + 2;
        const alphaIndex = i + 3;

        if(i > 4 * 10){
            outputPixels.data[redIndex - 4 * 10] = originalData[redIndex];
        }else {
            outputPixels[redIndex] = originalData[redIndex];
        }

        if(i < pixels.data.length - 4 * 10){
            outputPixels.data[greenIndex + 4 * 10] = originalData[greenIndex];
        }else {
            outputPixels[greenIndex] = originalData[greenIndex];
        }

        if(i > 4 * 20){
            outputPixels.data[blueIndex - 4 * 20] = originalData[blueIndex];
        }else {
            outputPixels[blueIndex] = originalData[blueIndex];
        }

        outputPixels.data[alphaIndex] = originalData[alphaIndex];
    }
    return outputPixels;
}

function greenScreen(pixels){
    const levels = {};

    document.querySelectorAll('.rgb input').forEach(element => {
        levels[element.name] = element.value;
    });

    for(let i=0; i<pixels.data.length; i+=4){
        red = pixels.data[i + 0];
        green = pixels.data[i + 1];
        blue = pixels.data[i + 2];
        alpha = pixels.data[i + 3];

        if(red >= levels.rmin && green >= levels.gmin && blue >= levels.bmin
            && red <= levels.rmax && green <= levels.gmax && blue <= levels.bmax){
            pixels.data[i + 3] = 0;
        }
    }
    return pixels;
}

getVideo();

video.addEventListener('canplay', () => {
    console.log("Video canplay event fired, starting paintToCanvas.");
    paintToCanvas();
});
