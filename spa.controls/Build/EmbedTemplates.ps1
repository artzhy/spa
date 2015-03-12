param ([string]$path)

$scriptPath = Join-Path $path "Build\Latest\spa.controls-latest.js"
$script = Get-Content $scriptPath -Encoding UTF8

Function processTemplate($componentName)
{
	$templatePath = Join-Path $path "Controls/$($componentName)/$($componentName).html"

	if (Test-Path $templatePath) 
	{
		$templateContent = Get-Content $templatePath -Encoding UTF8
		$templateContent = $templateContent -replace "`n|`r" -replace '"', '\"'
		$script:script = $script -replace "'$($componentName).html'", """$($componentName).html"""
		$script:script = $script -replace """$($componentName).html""", """$($templateContent)"""
	}
}

$componentsDirectoryContents = Get-ChildItem -Path "$($path)Controls"

foreach ($fileOrDir in $componentsDirectoryContents) 
{
      if ($fileOrDir.Attributes -eq "Directory")
      {
            processTemplate $fileOrDir.Name
      }
}

[System.IO.File]::WriteAllLines($scriptPath, $script)