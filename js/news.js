const NewsKategorie = Object.freeze({
  VEROEFFENTLICHUNGEN: "Veröffentlichungen",
  INSTITUTSLEBEN: "Institutsleben",
  KURIOSItAETEN: "Kuriositäten des Alltags",
});

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
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-produktive-vermeidung-von-produktivitaet.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-07-07",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-wiss-fundierte-gruende.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-05-19",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-wobei-longitudinale-untersuchung.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-03-03",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-statistische-bedeutung-des-satzes.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2028-01-14",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-therapeutische-wirkung-sozialer-rueckzug.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-11-28",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "teamevent-oper.md",
    titel: "Teamevent im Nationaltheater",
    datum: "2027-10-28",
    bild: "pics/news/oper.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

  {
    datei: "neues-paper-gute-vorsaetze-bevorzugt.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-09-09",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-ueberinterpretation-alltaeglicher-muedigkeit.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-07-21",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "teamevent-hiking.md",
    titel: "Teamevent in den Bergen",
    datum: "2027-06-05",
    bild: "pics/news/hiking.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

  {
    datei: "neues-paper-die-rolle-unbequemer-einwaende.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-05-02",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-warum-menschen-ratschlaege-suchen.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2027-02-16",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "teamevent-billard.md",
    titel: "Teamevent am Billardtisch",
    datum: "2027-01-21",
    bild: "pics/news/billard.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

  {
    datei: "neues-paper-empirische-untersuchung-zus-selbstoptimierung.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-12-08",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "jahrestagung-2026.md",
    titel: "Methodius-Institut richtet erfolgreiche Fachtagung aus",
    datum: "2026-11-15",
    bild: "pics/news/eigene_konferenz.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

  {
    datei: "neues-paper-vorlaeufige-erkenntnisse-kontr-ueberinterpretation.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-10-17",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "jahrestagung-2026-poster.md",
    titel: "Ankündigung der Jahrestagung 2026",
    datum: "2026-09-29",
    bild: "pics/news/eigene_konferenz_poster.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

  {
    datei: "teamevent-rafting.md",
    titel: "Teamevent auf der Moldau",
    datum: "2026-09-15",
    bild: "pics/news/rafting.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

  {
    datei: "erkenntnis-amazon-cheap-cds.md",
    titel: "Unstimmigkeit in der Produktsuche",
    datum: "2026-09-05",
    bild: "pics/news/erkenntnis-amazon-cheap-cds.png",
    link: "https://www.amazon.de/s?i=popular&rh=n%3A255882%2Cp_36%3A-500&s=featured-rank&content-id=amzn1.sym.fc4f3753-af8e-4288-9354-f00cdcb2b673&pd_rd_r=90bcb95b-5d01-406b-a1b8-edb1ee93c9f9&pd_rd_w=M0pmc&pd_rd_wg=jTSWs&pf_rd_p=fc4f3753-af8e-4288-9354-f00cdcb2b673&pf_rd_r=NERF60648PVA1X44KV0X&ref=Oct_d_oup_S",
    linkText: "Überprüfe die aktuellen Treffer",
    kategorie: NewsKategorie.KURIOSItAETEN,
  },

  {
    datei: "erkenntnis-amazon-cd-preise.md",
    titel: "Preisabweichungen im Versandhandel",
    datum: "2026-08-31",
    bild: "pics/news/erkenntnis-amazon-cd-preise.png",
    link: "https://www.amazon.de/Shape-Fluidity-Digipak-Dool/dp/B08LS9VYGF/ref=sr_1_3?__mk_de_DE=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=V5IBWTPQ120Z&dib=eyJ2IjoiMSJ9.5w82_zdt_kO8RzGRNLIo6xotFtzsR9VLpULHdVVCPqcznzdWnU5XyYWYllIl368Atr9pWDmOnraBxUeoZop72-LWCsdt8RaBR0akJpXEpN-tP21LcNJZLglB4-WhM1B9hvB_DIyRXoWtkwYmdNatGYcTnvGEZqxTwGB4wrN6YiIX_hg47-4ezksixawYy3yvw4xyIvFpVfBPoe5J393igUhPFM9s3C2sbqeesIvYwlU.MpOwAxiTsuE27XJJHgDw8_csAPylUfKBEugTRve5CYI&dib_tag=se&keywords=dool+cd&qid=1788173090&sprefix=dool+cd%2Caps%2C109&sr=8-3",
    linkText: "Überprüfe einen Preis",
    kategorie: NewsKategorie.KURIOSItAETEN,
  },

  {
    datei: "neuer-ratgeber-muskelabbau.md",
    titel: "Neuer Ratgeber erschienen",
    datum: "2026-08-30",
    bild: "pics/ratgeber/Abnehmen dank Muskelabbau.png",
    link: "buch.html?titel=Abnehmen dank Muskelabbau",
    linkText: "Zum Ratgeber",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-ratgeber-als-wissenschaftliches-Instrument.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-08-28",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neuer-fall-ans-bett-gebunden.md",
    titel: "Neue Fallakte angelegt",
    datum: "2026-08-27",
    link: "problem.html?datei=ans-bett-gebunden.md",
    linkText: "Zur Fallakte",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-grenzen-der-wiss-ueberinterpretation.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-08-17",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "erkenntnis-hofer-limonade-preise.md",
    titel: "Bemerkenswerte Preisgestaltung im Discounter",
    datum: "2026-08-06",
    bild: "pics/news/erkenntnis-hofer-limonade-preise.png",
    kategorie: NewsKategorie.KURIOSItAETEN,
  },


  {
    datei: "neues-paper-korrelation-kausalitaet.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-08-03",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-muskelabbau.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-07-09",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-ueberinterpretation.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-06-21",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-empirische-plausibilitaet-unvollstaendige-datenlage.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-06-02",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-kontrollierte-fehlberatung.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-05-18",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "neues-paper-gegenstromorientierte-lebenswissenschaft.md",
    titel: "Neues Paper veröffentlicht",
    datum: "2026-05-04",
    link: "veroeffentlichungen.html",
    linkText: "Zu den Veröffentlichungen",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },

  {
    datei: "gruendung-methodius-institut.md",
    titel: "Methodius-Institut für Lebenswissenschaften gegründet",
    datum: "2026-05-04",
    bild: "pics/news/gruendung-methodius-institut.png",
    link: "institutsleben.html",
    linkText: "Zum Institutsleben",
    kategorie: NewsKategorie.INSTITUTSLEBEN,
  },

];
