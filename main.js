document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
    const shaderArtElement = document.querySelector('shader-art');
    if (shaderArtElement) {
        shaderArtElement.controls = false;
    }
});