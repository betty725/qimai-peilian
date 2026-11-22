param([Parameter(Mandatory)] [string] $Installer)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$protocolKey = 'HKCU:\Software\Classes\qimai-kanshan-v48'
$smokeReport = Join-Path $env:RUNNER_TEMP 'kanshan-smoke.json'

function Require($Value, [string] $Message) {
    if (-not $Value) { throw $Message }
}
function RunAndWait([string] $File, [string] $Arguments, [int] $TimeoutSeconds) {
    $p = Start-Process -FilePath $File -ArgumentList $Arguments -PassThru
    if (!$p.WaitForExit(1000 * $TimeoutSeconds)) { $p.Kill(); throw "$File timed out" }
    Require ($p.ExitCode -eq 0) "$File exited with code $($p.ExitCode)"
}
function GetPetBrowser {
    Get-CimInstance Win32_Process -Filter "Name = 'Kanshan.exe'" |
        Where-Object { $_.ExecutablePath -eq $script:exe -and $_.CommandLine -notmatch ' --type=' }
}
function ShowViaProtocol {
    $command = [Diagnostics.ProcessStartInfo]::new('qimai-kanshan-v48://show')
    $command.UseShellExecute = $true
    [void][Diagnostics.Process]::Start($command)
}

Require (!(Test-Path $protocolKey)) 'Test requires a clean Windows user.'
RunAndWait (Resolve-Path $Installer) '/S' 150
$reg = Get-Item "$protocolKey\shell\open\command"
$openCommand = $reg.GetValue('')
Require ($openCommand -match '^"([^"]+\\Kanshan\.exe)" -- "%1"$') "Unexpected protocol command: $openCommand"
$exe = $Matches[1]
Require (Test-Path $exe -PathType Leaf) 'Registered executable is missing.'
Require ($null -ne (Get-Item $protocolKey).GetValue('URL Protocol', $null)) 'Missing URL Protocol flag.'
$base = Split-Path $exe
foreach ($asset in @('pet.html','pet-shell.js','assets\pet-quiet\typing.gif','assets\pet-quiet\typing-frames\01.png','vendor\tasks-vision\pose_landmarker_full.task','vendor\tasks-vision\pose_landmarker_lite.task','vendor\tasks-vision\wasm\vision_wasm_internal.wasm')) {
    Require (Test-Path (Join-Path $base "resources\site\$asset") -PathType Leaf) "Missing packaged asset: $asset"
}
$shell = New-Object -ComObject WScript.Shell
foreach ($folder in @('DesktopDirectory','Programs')) {
    $path = [Environment]::GetFolderPath($folder)
    $found = Get-ChildItem $path -Filter '*.lnk' -Recurse | Where-Object { $shell.CreateShortcut($_.FullName).TargetPath -eq $exe }
    Require ($null -ne $found) "No application shortcut in $folder"
}
# Silent install normally leaves the app closed. Stop only this test install if the installer started it.
GetPetBrowser | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Start-Sleep 1
RunAndWait $exe ("--smoke-test=`"$smokeReport`"") 135
$report = Get-Content -LiteralPath $smokeReport -Raw | ConvertFrom-Json
Require ($report.ok -eq $true) ('Native smoke test failed: ' + ($report | ConvertTo-Json -Depth 5))
Write-Output ($report | ConvertTo-Json -Depth 5)

ShowViaProtocol
for ($i=0; $i -lt 30 -and !(GetPetBrowser); $i++) { Start-Sleep 1 }
$first = @(GetPetBrowser)
Require ($first.Count -eq 1) 'The web protocol did not start exactly one native app.'
ShowViaProtocol
Start-Sleep 3
$second = @(GetPetBrowser)
Require ($second.Count -eq 1 -and $second[0].ProcessId -eq $first[0].ProcessId) 'The protocol opened a second pet.'
Stop-Process -Id $first[0].ProcessId -Force
Start-Sleep 1

$uninstall = @(Get-ChildItem -LiteralPath $base -Filter 'Uninstall*.exe')
Require ($uninstall.Count -eq 1) 'Expected a single Windows uninstaller.'
RunAndWait $uninstall[0].FullName '/S' 90
for ($i=0; $i -lt 30 -and ((Test-Path $protocolKey) -or (Test-Path $exe)); $i++) { Start-Sleep 1 }
Require (!(Test-Path $protocolKey) -and !(Test-Path $exe)) 'Uninstall left the protocol or executable behind.'
Write-Output 'PASS: per-user install, offline assets, native pet window, shortcuts, protocol single instance, uninstall.'
