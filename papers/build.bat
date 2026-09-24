@echo off
if "%~1"=="" (
  echo Usage: build.bat papers\example-aevidence\main.tex [--spread]
  exit /b 2
)
python generate.py %*
