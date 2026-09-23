async function holeStudienBenutzer() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (session?.user) {
    return session.user;
  }

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .signInAnonymously();

  if (error) {
    console.error(
      "Fehler bei der Anmeldung:",
      error
    );

    return null;
  }

  return data.user;
}

async function markiereAlsAbgeschlossen(ratgeberId) {

  const user =
    await holeStudienBenutzer();

  if (!user) return;

  const {
    error
  } = await supabaseClient
    .from("studienfortschritt")
    .upsert({
      user_id: user.id,
      ratgeber_id: ratgeberId,
      completed_at:
        new Date().toISOString()
    });

  if (error) {
    console.error(
      "Fehler beim Speichern:",
      error
    );
  }
}

async function holeStudienfortschritt() {

  const user =
    await holeStudienBenutzer();

  if (!user) return [];

  const {
    data,
    error
  } = await supabaseClient
    .from("studienfortschritt")
    .select("ratgeber_id, completed_at")
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "Fehler beim Laden des Studienfortschritts:",
      error
    );

    return [];
  }

  return data;
}