# decap-cms-google-apps-script
A [Decap CMS](https://decapcms.org/) (formerly Netlify CMS) Github OAuth Client implementation in Google Apps Script acting as the External OAuth Client allowing Decap CMS without using Netlify's service.

Unfortunately Google Apps Script uses double iframes for web type projects which cause a problem with the built-in Github backend authorization code flow. 

While the built-in Github backend doesn't support authorization code flow with PKCE (Proof Key for Code Exchange) so we will create custom OAuth2 PKCE client as middleware to make Github backend work with Google Apps Script project.

## Installation

### 1. Create Google Apps Script project

- Go to [https://script.google.com/](https://script.google.com/) and then create `New Project`
- Click `Untitled project` then give your project a name `decap` or anything you like and click `Rename` 
- Replace `Code.gs` content with [Code.js](https://github.com/nuzulul/decap-cms-google-apps-script/blob/main/src/server/Code.js)
- Add a new HTML file with a name `config.html` and then replace the content with [config.html](https://github.com/nuzulul/decap-cms-google-apps-script/blob/main/src/server/config.html)
- Click `Deploy` > `New deployment` > `Select type` > `Web app`
- Set `Configuration` > `Web app` > `Execute as` to `Me`
- Set `Configuration` > `Web app` > `Who has access` to `anyone`
- Click `Deploy`
- Click `Authorize access`
- Click your google account
- Click `Go to decap (unsafe)`
- Click `Allow`
- Copy the `web app url`

### 2. Create OAuth application at Github

- Go to [https://github.com/settings/developers](https://github.com/settings/developers)
- Create `New OAuth app`
- Set `Application name` to anything you like
- Set `Homepage URL` to your site’s URL
- Set `Authorization callback URL` to web app url above
- Clik `Register application`
- Generate a `Client Secret`
- Copy the `Client ID` and `Client Secret`

### 3. Create OAuth2 with PKCE client

- Copy [client.html](https://github.com/nuzulul/decap-cms-google-apps-script/blob/main/src/client/client.html) file to your Decap CMS `admin` directory or any directory you will publish it.
- Update the configuration
```javascript
let client_config = {
    github_client_id : '12345',
    apps_script_url : 'https://script.google.com/macros/s/SCRIPTID/exec',
    pkce_client_endpoint : 'https://example.com/admin/client.html'
}  
```
- Set `github_client_id` to `Client ID` above
- set `apps_script_url` to `web app url` above
- Set `pkce_client_endpoint` to this PKCE client.html location

### 4. Configure Decap CMS

- Update your Decap CMS `config.yml`
```yaml
backend:
  name: github # backend to use
  repo: username/repo # your username and repo
  branch: main # branch to use
  base_url: https://example.com # PKCE client.html hostname (just the base domain, no path)
  auth_endpoint: /admin/client.html # PKCE client.html path
```

### 5. Update Google Apps Script project configuration

- Finally, update `config.html` in Google Apps Script project above
```json
{
  "github_client_id":"12345",
  "github_client_secret":"12345",
  "pkce_client_endpoint":"https://example.com/admin/client.html"
}
```
- Set `github_client_id` to `Client ID` above
- Set `github_client_secret` to `Client Secret` above
- Set `pkce_client_endpoint` to PKCE client.html location above
- Click `Deploy` > `Manage deployments` > `Edit`
- Set `Configuration` > `Version` to `New version`
- Click `Deploy`

### 6. Publish

Publish your Decap CMS and open it on your browser, now you should see a Login with Github button