const state = {
    document: {
        data: null,
        totalPages: 1,
        currentPage: 1,
        zoom: 1.5,
        rotation: 0,
    },
    render: {
        canvas: null,
        context: null,
        isRendering: false,
    },
    annotations: {
        drawing: false,
        canvas: null,
        context: null,
    },
    pointer: {
        prevX: 0,
        currX: 0,
        prevY: 0,
        currY: 0,
    },
    tools: {
        pen: {
            size: 4,
            color: 'black',
        }
    }
};

const init = () => {
    state.render.canvas = document.getElementById('pdf-render');
    state.render.context = state.render.canvas.getContext('2d');

    state.annotations.canvas = document.getElementById('pdf-annotations');
    state.annotations.context = state.annotations.canvas.getContext('2d');
    state.annotations.context.fillStyle = "rgba(0, 0, 200, 0.5)";

    state.annotations.canvas.addEventListener('mouseup', event => {
        state.annotations.drawing = false
    }, false);
    state.annotations.canvas.addEventListener('mousedown', event => {
        state.annotations.drawing = true
    }, false);
    state.annotations.canvas.addEventListener('mouseenter', event => {
        drawInPointerPosition('enter', event)
    }, false);
    state.annotations.canvas.addEventListener('mousedown', event => {
        drawInPointerPosition('press', event)
    }, false);
    state.annotations.canvas.addEventListener('mousemove', event => {
        drawInPointerPosition('move', event)
    }, false);

    // loadPdf('./plan-large.pdf')
    loadPdf('./plan.pdf')
}

const setColor = color => {
    state.tools.pen.color = color
    state.tools.pen.size = color === 'white' ? 32 : 4;
}

const erase = () => {
    state.annotations.context.clearRect(0, 0, w, h);
}

const save = () => {
    console.log(canvas.toDataURL());
}

const drawInPointerPosition = (action, event) => {
    state.pointer.prevX = state.pointer.currX;
    state.pointer.prevY = state.pointer.currY;
    state.pointer.currX = event.clientX - state.annotations.canvas.offsetLeft;
    state.pointer.currY = event.clientY - state.annotations.canvas.offsetTop;


    if (action === 'press') {
        state.annotations.context.beginPath();
        state.annotations.context.fillStyle = state.tools.pen.color;
        state.annotations.context.fillRect(state.pointer.currX, state.pointer.currY, state.tools.pen.size, state.tools.pen.size);
        state.annotations.context.stroke();
        state.annotations.context.closePath();
    }

    if (action === 'enter' || action === 'move') {
        if (state.annotations.drawing) {
            state.annotations.context.beginPath();
            state.annotations.context.moveTo(state.pointer.prevX, state.pointer.prevY);
            state.annotations.context.lineTo(state.pointer.currX, state.pointer.currY);
            state.annotations.context.strokeStyle = state.tools.pen.color;
            state.annotations.context.fillStyle = state.tools.pen.color;
            state.annotations.context.lineWidth = state.tools.pen.size;
            state.annotations.context.stroke();
            state.annotations.context.closePath();
        }
    }
}

const loadPage = () => {
    if (state.document.data && !state.render.isRendering) {
        state.document.data.getPage(state.document.currentPage).then(page => {
            state.render.isRendering = true

            const viewport = page.getViewport({ scale: state.document.zoom, rotation: state.document.rotation });

            state.render.canvas.width = viewport.width;
            state.render.canvas.height = viewport.height;
            state.annotations.canvas.width = viewport.width;
            state.annotations.canvas.height = viewport.height;

            // canvasContext.clearRect(0, 0, viewport.width, viewport.height);

            const renderTask = page.render({ canvasContext: state.render.context, viewport });

            renderTask.promise
                .then(() => {
                    page.getAnnotations().then(annotationData => {
                        console.info('annotationData:', annotationData);
                        // document.getElementById('pdf-annotation-layer').innerHTML = annotationData
                    })
                    page.getTextContent().then(textContent => {
                        console.info('textContent:', textContent);
                        // document.getElementById('pdf-text-layer').innerHTML = annotationData
                    })
                }, reason => {
                    console.error(reason);
                })
                .finally(() => {
                    state.render.isRendering = false;
                });
        });
    }
}

const loadPdf = src => {
    const loadingTask = pdfjsLib.getDocument(src);

    loadingTask.onProgress = progress => {
        var percent = parseInt(progress.loaded / progress.total * 100);

        if (percent < 100) {
            document.getElementById('progress').innerHTML = `| Loading... ${percent}%`;
        } else {
            document.getElementById('progress').innerHTML = '';
        }
    }

    loadingTask.promise.then(pdf => {
        state.document.currentPage = 1
        state.document.totalPages = pdf.numPages
        state.document.data = pdf
        loadPage()
    }, reason => {
        console.error(reason)
    });
}


// CONTROLS

const rotateClockwise = () => {
    if (state.document.rotation === 360) {
        state.document.rotation = 90
    } else {
        state.document.rotation += 90
    }
    loadPage()
}

const resetZoom = () => {
    state.document.zoom = 1.5
    loadPage()
}

const increaseZoom = () => {
    state.document.zoom += 0.5
    loadPage()
}

const decreaseZoom = () => {
    if (state.document.zoom > 0.5) {
        state.document.zoom -= 0.5
        loadPage()
    }
}

const loadPrevPage = () => {
    if (state.document.currentPage <= 1) {
        return
    }
    state.document.currentPage--
    loadPage()
}

const loadNextPage = () => {
    if (state.document.currentPage >= state.document.totalPages) {
        return;
    }
    state.document.currentPage++
    loadPage()
}
