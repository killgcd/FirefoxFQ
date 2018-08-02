%%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a 
cls
@echo off

IF EXIST %~dp0Firefly\firefly.exe (
echo ""
) ELSE (
		echo 正在下载firefly，请稍候，部分杀毒软件可能有误报...
    start /wait "" "%~dp0Firefly\downFirefly.bat"
)


xcopy /Y %~dp0Firefox\defaults\pref\local-settings-ffly  %~dp0Firefox\defaults\pref\local-settings.js
cls
start "" "%~dp0Firefox/firefox.exe" -no-remote -profile "%~dp0Firefox/Profile" https://www.bannedbook.org/bnews/fq/?utm_source=FFfirefly
start /wait "" "%~dp0Firefly\prestart.exe"
start "" "%~dp0Firefly\firefly.exe"
exit