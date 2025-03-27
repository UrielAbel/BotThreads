@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ================================
echo     BOT DE THREADS - SORU AGENCY
echo ================================
echo.

:: ==========================
:: VERIFICAR DEPENDENCIAS
:: ==========================
if not exist "node_modules" (
    echo No se encontraron dependencias. Instalando con npm install...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error durante la instalación de dependencias.
        pause
        exit /b 1
    )
    echo 📦 Dependencias instaladas correctamente.
    echo.
) else (
    echo ✔️ Dependencias ya instaladas.
    echo.
)

:: Archivo donde se guarda la ultima cuenta usada
set lastFile=last_account.txt
if exist %lastFile% (
    set /p lastAccount=<%lastFile%
)

:ask_account
set /p newAcc="Queres usar una cuenta existente (E) o crear una nueva (N)? [E/N]: "
if /i "!newAcc!"=="N" goto create_account
if /i "!newAcc!"=="E" goto list_accounts
goto ask_account

:create_account
set /p accountId="Escribi un nombre para la nueva cuenta (sin espacios): "
set setupFlag=--setup
goto ask_headless

:list_accounts
echo Cuentas detectadas:
for /f "delims=" %%a in ('dir /b /ad ".profile-*"') do (
    set "acc=%%a"
    set "acc=!acc:.profile-=!"
    echo - !acc!
)

if defined lastAccount (
    echo.
    set /p accountId="Escribi el nombre exacto de la cuenta (ENTER para usar '!lastAccount!'): "
    if "!accountId!"=="" set accountId=!lastAccount!
) else (
    set /p accountId="Escribi el nombre exacto de la cuenta: "
)
set setupFlag=
goto ask_headless

:ask_headless
set /p showBrowser="Queres ver el navegador? [S/N]: "
if /i "!showBrowser!"=="S" (
    set headlessFlag=--no-headless
) else (
    set headlessFlag=
)

set /p screenshots="Queres guardar capturas? [S/N]: "
if /i "!screenshots!"=="N" (
    set screenshotsFlag=--no-screenshots
) else (
    set screenshotsFlag=
)

echo !accountId! > %lastFile%
echo.
echo Iniciando bot con cuenta: !accountId!
echo ================================
echo.

:: Ejecutar el bot con los flags correspondientes
node index.js !accountId! !setupFlag! !headlessFlag! !screenshotsFlag!
pause
