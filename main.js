document.addEventListener('contextmenu', function(e) {
  e.preventDefault(); // Mencegah tindakan default dari klik kanan
});


  const img = document.getElementById('profile-img');
  const staticSrc = 'img/pp.png';
  const gifSrc = 'img/uwu.gif';

  img.addEventListener('mouseenter', () => {
    img.src = gifSrc;
  });
  img.addEventListener('mouseleave', () => {
    img.src = staticSrc;
  });