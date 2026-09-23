function baueFooter() {

  const platzhalter =
    document.getElementById(
      "footer-platzhalter"
    );

  if (!platzhalter) return;

  platzhalter.innerHTML = `

    <footer class="site-footer">

      <div class="wrap footer-row">

        <p>&copy; 2026 Dr. Maximilian Methodius</p>

        <nav class="footer-nav" aria-label="Footer-Navigation">

          <a href="kontakt.html">
            Kontakt
          </a>

          <a href="impressum.html">
            Impressum
          </a>

        </nav>

      </div>
    </footer>
  `;
}


document.addEventListener(
  "DOMContentLoaded",
  baueFooter
);
