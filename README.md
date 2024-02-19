# node-webdev-basic - basic web/dev environment

[Supporting](https://github.com/robertsaupe/node-webdev-basic#supporting) |
[Features](https://github.com/robertsaupe/node-webdev-basic#features) |
[License](https://github.com/robertsaupe/node-webdev-basic#license) |
[Installing](https://github.com/robertsaupe/node-webdev-basic#installing) |
[Getting started](https://github.com/robertsaupe/node-webdev-basic#getting-started) |
[Updating](https://github.com/robertsaupe/node-webdev-basic#updating)

## Supporting

[GitHub](https://github.com/sponsors/robertsaupe) |
[Patreon](https://www.patreon.com/robertsaupe) |
[PayPal](https://www.paypal.com/donate?hosted_button_id=SQMRNY8YVPCZQ) |
[Amazon](https://www.amazon.de/ref=as_li_ss_tl?ie=UTF8&linkCode=ll2&tag=robertsaupe-21&linkId=b79bc86cee906816af515980cb1db95e&language=de_DE)

## Features

- build web projects with live develop
  - copy files
  - ejs -> minify html
  - sass/scss -> minify css
  - minify js
  - optimize/minify images (png,svg,gif,jpg,jpeg)
  - favicon.png -> favicon.ico

## License

This software is distributed under the MIT license. Please read [LICENSE](LICENSE) for information.

## Installing

### Requirements

- [Node.js](https://nodejs.org)
- [Gulp](https://gulpjs.com/docs/en/getting-started/quick-start)

### Installing Requirements on Windows

#### Installing [NVM for Windows](https://github.com/coreybutler/nvm-windows)

Download and install nvm-setup.exe from [releases](https://github.com/coreybutler/nvm-windows/releases)

#### Installing Node.js Version using [NVM for Windows](https://github.com/coreybutler/nvm-windows)

```powershell
$nvmrc = Get-Content .nvmrc
Invoke-Expression -Command "nvm install $nvmrc"
Invoke-Expression -Command "nvm use $nvmrc"
```

#### PowerShell Startup Script for .nvmrc

##### Create a profile file

```powershell
New-item –type file –force $profile
```

##### edit the created profile file and add

```powershell
Function runNvmUse([string]$version) {
    Invoke-Expression -Command "nvm use $version"
}
if (Test-Path .nvmrc) {
    $nvmrc = Get-Content .nvmrc
    $project_version = "v$nvmrc"
    $current_version = Invoke-Expression -Command "node -v"
    if ($project_version -ne $current_version) {
        runNvmUse($nvmrc)
    } else {
        Write-Output "Already using node $current_version"
    }
}
```

### Install Gulp

```bash
npm install -g gulp
```

### Environment

```bash
git clone https://github.com/robertsaupe/node-webdev-basic.git
cd node-webdev-basic/
npm i
```

## Getting started

live develop:

```bash
npm run dev_build
```

just build project:

```bash
npm run build
```

clear builds:

```bash
npm run clear
```

## Updating

### Updating Dependencies

```bash
npm install -g npm-check-updates
ncu -u
npm install
```
