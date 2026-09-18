<#
.SYNOPSIS
    Führt alle Prüf-Skripte aus dem Ordner "test" aus.

.DESCRIPTION
    Dieses Skript gehört in den Projekt-Root. Es ruft jedes Skript
    test\pruefe_*.py mit dem Projekt-Root als Argument auf. Ein
    fehlgeschlagenes Skript bricht den Lauf nicht ab - am Ende gibt es
    eine Zusammenfassung, und der Exit-Code ist 1, sobald mindestens ein
    Skript Fehler gemeldet hat (sonst 0).

    Neue Skripte, die nach dem Muster pruefe_*.py benannt sind, werden
    automatisch mit aufgerufen.

.PARAMETER Python
    Optional: Name oder Pfad des Python-Interpreters. Ohne Angabe wird
    der Reihe nach py, python und python3 versucht.

.EXAMPLE
    .\pruefe_alle.ps1

.EXAMPLE
    .\pruefe_alle.ps1 -Python "C:\Python312\python.exe"

.NOTES
    Falls PowerShell das Ausführen von Skripten blockiert:
        powershell -ExecutionPolicy Bypass -File .\pruefe_alle.ps1
#>

[CmdletBinding()]
param(
    [string]$Python
)

$root    = $PSScriptRoot
$testDir = Join-Path $root 'test'


function Find-Python {
    param([string]$Bevorzugt)

    $kandidaten = if ($Bevorzugt) { @($Bevorzugt) } else { @('py', 'python', 'python3') }

    foreach ($name in $kandidaten) {
        $cmd = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue |
               Select-Object -First 1
        if (-not $cmd) { continue }

        # Der Windows-Store-Platzhalter "python.exe" existiert immer, liefert
        # aber nur einen Fehler - deshalb wird der Interpreter kurz getestet.
        try {
            & $cmd.Source --version *> $null
            if ($LASTEXITCODE -eq 0) { return $cmd.Source }
        }
        catch { }
    }
    return $null
}


$pythonExe = Find-Python -Bevorzugt $Python
if (-not $pythonExe) {
    Write-Host "Python wurde nicht gefunden. Bitte Python installieren oder den Interpreter mit -Python angeben." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -LiteralPath $testDir -PathType Container)) {
    Write-Host "Ordner nicht gefunden: $testDir" -ForegroundColor Red
    exit 1
}

$skripte = @(Get-ChildItem -LiteralPath $testDir -Filter 'pruefe_*.py' -File | Sort-Object Name)
if ($skripte.Count -eq 0) {
    Write-Host "Keine Skripte (pruefe_*.py) in $testDir gefunden." -ForegroundColor Red
    exit 1
}

Write-Host "Python:       $pythonExe"
Write-Host "Project Root: $root"
Write-Host "Skripte:      $($skripte.Count)"

# Die Skripte geben Umlaute und Symbole (⚠ ✗) als UTF-8 aus.
$alteKonsolenKodierung = [Console]::OutputEncoding
$altesPythonUtf8       = $env:PYTHONUTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONUTF8 = '1'

$ergebnisse = @()

try {
    foreach ($skript in $skripte) {

        Write-Host ""
        Write-Host ("=" * 72) -ForegroundColor Cyan
        Write-Host " $($skript.Name)" -ForegroundColor Cyan
        Write-Host ("=" * 72) -ForegroundColor Cyan

        $exitCode = 1
        try {
            & $pythonExe $skript.FullName $root
            if ($null -ne $LASTEXITCODE) { $exitCode = $LASTEXITCODE }
        }
        catch {
            Write-Host "Skript konnte nicht gestartet werden: $($_.Exception.Message)" -ForegroundColor Red
        }

        $ergebnisse += [pscustomobject]@{
            Skript   = $skript.Name
            ExitCode = $exitCode
            Ok       = ($exitCode -eq 0)
        }
    }
}
finally {
    [Console]::OutputEncoding = $alteKonsolenKodierung
    $env:PYTHONUTF8 = $altesPythonUtf8
}

# ---- Zusammenfassung ----------------------------------------------------

Write-Host ""
Write-Host ("=" * 72) -ForegroundColor Cyan
Write-Host " Zusammenfassung" -ForegroundColor Cyan
Write-Host ("=" * 72) -ForegroundColor Cyan

$laenge = ($ergebnisse | ForEach-Object { $_.Skript.Length } | Measure-Object -Maximum).Maximum

foreach ($ergebnis in $ergebnisse) {
    $name = $ergebnis.Skript.PadRight($laenge)
    if ($ergebnis.Ok) {
        Write-Host "  OK      $name" -ForegroundColor Green
    }
    else {
        Write-Host "  FEHLER  $name (Exit-Code $($ergebnis.ExitCode))" -ForegroundColor Red
    }
}

$fehlgeschlagen = @($ergebnisse | Where-Object { -not $_.Ok })
$erfolgreich    = $ergebnisse.Count - $fehlgeschlagen.Count

Write-Host ""
if ($fehlgeschlagen.Count -eq 0) {
    Write-Host "Alle $($ergebnisse.Count) Skripte ohne Fehler durchgelaufen." -ForegroundColor Green
    exit 0
}

Write-Host "$erfolgreich von $($ergebnisse.Count) Skripten ohne Fehler, $($fehlgeschlagen.Count) mit Fehlern." -ForegroundColor Red
exit 1
