# Run this script as Administrator
# Right-click and select "Run with PowerShell as Administrator"

Write-Host "Adding Windows Firewall rule for Node.js server on port 5000..." -ForegroundColor Green

netsh advfirewall firewall add rule name="Node.js Server Port 5000" dir=in action=allow protocol=TCP localport=5000

Write-Host "`nFirewall rule added successfully!" -ForegroundColor Green
Write-Host "Your server should now be accessible from other devices on the network." -ForegroundColor Cyan
Write-Host "`nServer URL: http://192.168.20.7:5000" -ForegroundColor Yellow
Write-Host "Test from phone: http://192.168.20.7:5000/health" -ForegroundColor Yellow

pause
