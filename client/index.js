document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("time-counter");

  function time() {
    el.textContent = dayjs().format('D MMM - HH:mm:ss');
  }

  setInterval(time, 1000);
});
