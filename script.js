const state = {
    document: null,
    pageNum: 1,
    totalPages: 1,
    rotation: 0,
    scale: 1.5,
    isRendering: false,
};

const renderPage = page => {
    state.isRendering = true

    const viewport = page.getViewport({ scale: state.scale, rotation: state.rotation });

    const canvas = document.getElementById('pdf-canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const canvasContext = canvas.getContext('2d');
    canvasContext.clearRect(0, 0, viewport.width, viewport.height);

    const renderTask = page.render({ canvasContext, viewport });

    renderTask.promise
        .then(() => {
            page.getAnnotations().then(annotationData => {
                console.info('annotationData');
                console.info(annotationData);
            })
            page.getTextContent().then(textContent => {
                console.info('textContent');
                console.info(textContent);
            })
        }, reason => {
            console.error(reason);
        })
        .finally(() => {
            state.isRendering = false;
        });
}

const loadPage = pagenum => {
    if (state.document && !state.isRendering) {
        state.document.getPage(state.pageNum).then(renderPage)
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
        state.document = pdf
        state.totalPages = pdf.numPages
        loadPage(1)
    }, reason => {
        console.error(reason)
    });
}


// CONTROLS

const rotateClockwise = () => {
    if (state.rotation === 360) {
        state.rotation = 90
    } else {
        state.rotation += 90
    }
    loadPage(state.pageNum)
}

const resetZoom = () => {
    state.scale = 1.5
    loadPage(state.pageNum)
}

const increaseZoom = () => {
    state.scale += 0.5
    loadPage(state.pageNum)
}

const decreaseZoom = () => {
    if (state.scale > 0.5) {
        state.scale -= 0.5
        loadPage(state.pageNum)
    }
}

const loadPrevPage = () => {
    if (state.pageNum <= 1) {
        return
    }
    state.pageNum--
    loadPage(state.pageNum)
}

const loadNextPage = () => {
    if (state.pageNum >= state.totalPages) {
        return;
    }
    state.pageNum++
    loadPage(state.pageNum)
}

loadPdf('./plan-large.pdf')
// loadPdf('./plan.pdf')