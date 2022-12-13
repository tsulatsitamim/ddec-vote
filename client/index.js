document.addEventListener("DOMContentLoaded", () => {
  var splide = new Splide(".splide");
  splide.mount();

  lightGallery(document.getElementById("gallery"), {
    plugins: [lgZoom, lgThumbnail],
  });

  const customClub = document.getElementById("fClubCustom")
  document.getElementById("fClub").addEventListener('change', (event) => {
    console.log(event.target.value)
    customClub.style.display = event.target.value === "Lainnya" ? "block" : "none"
  });

  getData();
});
