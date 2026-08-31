/*
  Liste aller News-Beiträge.

  Jeder Eintrag besteht aus:
  - datei: Dateiname unter md/news/
  - titel: Überschrift des Beitrags
  - datum: Datum im ISO-Format (YYYY-MM-DD), wird für die Anzeige
    über formatiereDatumDeutsch() (siehe js/datumsformat.js) in die
    deutsche Lesefassung umgewandelt
  - bild: optionaler Bildpfad; wird am Ende des Beitrags angezeigt
  - link: optionaler Link, z.B. zu einem neuen Ratgeber
  - linkText: optionaler Text für den Link
*/

const newsListe = [

  {
    datei: "neues-paper-problem-tatsaechlich-geloest.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-08-22",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-produktive-vermeidung-von-produktivitaet.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-07-07",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-wiss-fundierte-gruende.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-05-19",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-wobei-longitudinale-untersuchung.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-03-03",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-statistische-bedeutung-des-satzes.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-01-14",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-therapeutische-wirkung-sozialer-rueckzug.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-11-28",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-gute-vorsaetze-bevorzugt.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-09-09",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-ueberinterpretation-alltaeglicher-muedigkeit.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-07-21",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-die-rolle-unbequemer-einwaende.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-05-02",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-warum-menschen-ratschlaege-suchen.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-02-16",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-empirische-untersuchung-zus-selbstoptimierung.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-12-08",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-vorlaeufige-erkenntnisse-kontr-ueberinterpretation.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-10-17",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "erkenntnis-amazon-cheap-cds.md",
    titel: "Unstimmigkeit in der Produktsuche",
    datum: "2026-09-05",
    link: "https://www.amazon.de/s?i=popular&rh=n%3A255882%2Cp_36%3A-500&s=featured-rank&content-id=amzn1.sym.fc4f3753-af8e-4288-9354-f00cdcb2b673&pd_rd_r=90bcb95b-5d01-406b-a1b8-edb1ee93c9f9&pd_rd_w=M0pmc&pd_rd_wg=jTSWs&pf_rd_p=fc4f3753-af8e-4288-9354-f00cdcb2b673&pf_rd_r=NERF60648PVA1X44KV0X&ref=Oct_d_oup_S",
    linkText: "Überprüfe die aktuellen Treffer."
  },

  {
    datei: "erkenntnis-amazon-cd-preise.md",
    titel: "Preisabweichungen im Versandhandel",
    datum: "2026-08-31",
    link: "",  // TODO
    linkText: "Überprüfe einen Preis."
  },

  {
    datei: "neuer-ratgeber-muskelabbau.md",
    titel: "Neuer Ratgeber erschienen",
    datum: "2026-08-30",
    bild: "pics/ratgeber/Abnehmen dank Muskelabbau.png",
    link: "buch.html?titel=Abnehmen dank Muskelabbau",
    linkText: "Zum Ratgeber"
  },

  {
    datei: "neues-paper-ratgeber-als-wissenschaftliches-Instrument.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-08-28",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neuer-fall-ans-bett-gebunden.md",
    titel: "Neue Fallakte angelegt",
    datum: "2026-08-27",
    link: "problem.html?datei=ans-bett-gebunden.md",
    linkText: "Zur Fallakte"
  },

  {
    datei: "neues-paper-grenzen-der-wiss-ueberinterpretation.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-08-17",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "erkenntnis-hofer-limonade-preise.md",
    titel: "Bemerkenswerte Preisgestaltung im Discounter",
    datum: "2026-08-06",
  },


  {
    datei: "neues-paper-korrelation-kausalitaet.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-08-03",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-muskelabbau.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-07-09",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-ueberinterpretation.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-06-21",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-empirische-plausibilitaet-unvollstaendige-datenlage.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-06-02",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-kontrollierte-fehlberatung.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-05-18",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "neues-paper-gegenstromorientierte-lebenswissenschaft.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-05-04",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen"
  },

  {
    datei: "gruendung-methodius-institut.md",
    titel: "Methodius-Institut für Lebenswissenschaften gegründet",
    datum: "2026-05-04",
    bild: "pics/news/gruendung-methodius-institut.png"
  },

];
