%%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a 
xcopy /Y %~dp0Firefox\defaults\pref\local-settings-xx  %~dp0Firefox\defaults\pref\local-settings.js
cls
@echo off
start "" "%~dp0XX-Net\start.bat"
start /wait "" "%~dp0waiting.vbs"
start "" "%~dp0Firefox/firefox.exe" -no-remote -profile "%~dp0Firefox/Profile" https://www.bannedbook.org/bnews/fq/?utm_source=ff-XX-Net
echo 由于封锁严重，因此可能需要数分钟到数小时的初始化IP扫描，方能正常运行。如果刚启动时打不开网页，请耐心等待初始化IP扫描，运行一段时间后，使用效果会更好...
pause