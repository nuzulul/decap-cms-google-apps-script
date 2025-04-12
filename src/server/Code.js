const jsonString = HtmlService.createHtmlOutputFromFile('config.html').getContent()
const jsonObject = JSON.parse(jsonString)
if(jsonObject.github_client_id && jsonObject.github_client_secret && jsonObject.pkce_client_endpoint){
    PropertiesService.getScriptProperties().setProperty('github_client_id', jsonObject.github_client_id)
    PropertiesService.getScriptProperties().setProperty('github_client_secret', jsonObject.github_client_secret)
    PropertiesService.getScriptProperties().setProperty('pkce_client_endpoint', jsonObject.pkce_client_endpoint)
}
let github_client_id = PropertiesService.getScriptProperties().getProperty('github_client_id')
let github_client_secret = PropertiesService.getScriptProperties().getProperty('github_client_secret')
let pkce_client_endpoint = PropertiesService.getScriptProperties().getProperty('pkce_client_endpoint')

const cache = CacheService.getScriptCache()

let auth_config = {
    client_id: github_client_id,
    client_secret : github_client_secret,
    redirect_uri: ScriptApp.getService().getUrl(),
    authorization_endpoint: "https://github.com/login/oauth/authorize",
    token_endpoint: "https://github.com/login/oauth/access_token"
}

function renderTemplate(content){
        let html = `<!DOCTYPE html>
                    <html>
                      <head>
                        <base target="_top">
                      </head>
                      <body>
                      <div style="display: flex; align-content: center; justify-content: center; align-items: center; height: 100vh;">
                        ${content}
                      </div>
                    </body>
                    </html>`  
        return html  
}


function doGet(e) {

  if(e.parameter.response_type == "code" 
      && e.parameter.code_challenge_method == "S256" 
      && e.parameter.client_id == github_client_id
      && e.parameter.redirect_uri == pkce_client_endpoint
  ){

      const cache = CacheService.getScriptCache()
      cache.put('state', e.parameter.state)
      cache.put('code_challenge', e.parameter.code_challenge)

      var url = auth_config.authorization_endpoint 
          + "?"
          + "&client_id="+encodeURIComponent(auth_config.client_id)
          + "&state="+encodeURIComponent(e.parameter.state)
          + "&scope="+encodeURIComponent(e.parameter.scope)
          + "&redirect_uri="+encodeURIComponent(auth_config.redirect_uri)
   
      let html = `<a style="text-decoration: none;padding: 2em 3em;background-color: rgb(49, 61, 62);color: rgb(255, 255, 255);border: 0px;border-radius: 5px;" href="${url}">Continue with Github</a>`
      html = renderTemplate(html)
      return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 

  }else if(e.parameter.code && e.parameter.state){
      cache.put('code', e.parameter.code)
      const url = `${pkce_client_endpoint}?code=${encodeURIComponent(e.parameter.code)}&state=${encodeURIComponent(e.parameter.state)}`
      let html = `<a style="text-decoration: none;padding: 2em 3em;background-color: rgb(49, 61, 62);color: rgb(255, 255, 255);border: 0px;border-radius: 5px;" href="${url}">Confirm Github Authorization</a>`
      html = renderTemplate(html)
      return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 
  }else{
      let response = {
        error: {
          response_type: (e.parameter.response_type == "code"),
          code_challenge_method: (e.parameter.code_challenge_method == "S256"),
          client_id: (e.parameter.client_id == github_client_id),
          redirect_uri: (e.parameter.redirect_uri == pkce_client_endpoint)
        }
      }
      let html = `<div>Error :</br><pre>${JSON.stringify(response)}</pre></div>`
      html = renderTemplate(html)
      return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 
  }
}

function doPost(e){

  function validate_pkce(verifier){
      const cached = cache.get('code_challenge')
      if (cached != null){
          const sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier)
          const challenge = Utilities.base64Encode(sha256Hash)
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '') 
          if(cached == challenge){
            return true
          }else{
            return false
          }       
      }else{
        return false
      }
  }

  function validate_code(code){
      const cached = cache.get('code')
      if (cached != null){
        if(code == cached){
          return true
        }else{
          return false
        }
      }else{
        return false
      }
  }

  if(e.parameter.grant_type == "authorization_code"
      && e.parameter.client_id == github_client_id
      && e.parameter.redirect_uri == pkce_client_endpoint
      && validate_pkce(e.parameter.code_verifier)
      && validate_code(e.parameter.code)
  ){
      cache.removeAll(['code', 'code_challenge', 'state'])
      
      const data = {
        client_id: auth_config.client_id,
        client_secret: auth_config.client_secret,
        code:e.parameter.code,
      }

      const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(data),
        headers:{
          accept: 'application/json'
        }
      }

      const response = UrlFetchApp.fetch(auth_config.token_endpoint, options) 

      var output = ContentService.createTextOutput()
      output.setContent(response)
      output.setMimeType(ContentService.MimeType.TEXT)
      return output                
  }else{
      var response = {
          error: {
            grant_type: (e.parameter.grant_type == "authorization_code"),
            client_id: (e.parameter.client_id == github_client_id),
            redirect_uri: (e.parameter.redirect_uri == pkce_client_endpoint),
            validate_pkce: validate_pkce(e.parameter.code_verifier),
            validate_code: validate_code(e.parameter.code)
          }
      }
      var output = ContentService.createTextOutput()
      output.setContent(JSON.stringify(response))
      output.setMimeType(ContentService.MimeType.TEXT)
      return output  
  }
}
