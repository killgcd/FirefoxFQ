%%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a %%a 
xcopy /Y %~dp0Firefox\defaults\pref\local-settings-v2new  %~dp0Firefox\defaults\pref\local-settings.js
cls
@echo off
%1 start "" mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit
CD /D "%~dp0"
start "" "%~dp0v2rayB\v2rayN.exe"
start "" "%~dp0Firefox/firefox.exe" -no-remote -profile "%~dp0Firefox/Profile" https://www.bannedbook.org/bnews/fq/?utm_source=ff-v2ray

echo ------注意注意注意，必读必读必读------
echo 特别声明：本通道服务器来自网络免费分享，为方便网友而自动抓取，我们对其可靠性和安全性不做任何承诺。
echo 1、启动后如果Chrome页面打不开，点桌面右下角托盘区蓝色V图标，打开V2rayN软件；
echo 2、然后在V2rayN主界面，按Ctrl+A键选中所有服务器，然后点右键，再点：测试服务器真连接延迟（多选）
echo 3、测试完毕后，测试结果为数字的是可用服务器，测试结果数字越小越快,点测试结果列头可排序;
echo 4、鼠标点击选中一个可用服务器，按回车键激活，然后回到已打开的chrome浏览器刷新页面；如果还打不开页面可从最快到最慢的服务器挨个尝试；
echo 5、如果第4步挨个测试所有可用服务器都不行，那么点V2rayN左上角“订阅/更新订阅”，然后重复第2-4步。
echo ------注意注意注意，必读必读必读------
pause