function doGet(e) {
	const jsonString = HtmlService.createHtmlOutputFromFile("config.html").getContent()
	const jsonObject = JSON.parse(jsonString)
	if(jsonObject.github_client_id && jsonObject.github_client_secret){
		PropertiesService.getScriptProperties().setProperty('github_client_id', jsonObject.github_client_id)
		PropertiesService.getScriptProperties().setProperty('github_client_secret', jsonObject.github_client_secret)
	}
	let github_client_id = PropertiesService.getScriptProperties().getProperty('github_client_id')
	let github_client_secret = PropertiesService.getScriptProperties().getProperty('github_client_secret')

  let code = e.parameter.code
  let state = e.parameter.state

  let auth_config = {
    client_id: github_client_id,
    client_secret : github_client_secret,
    redirect_uri: ScriptApp.getService().getUrl(),
    authorization_endpoint: "https://github.com/login/oauth/authorize",
    token_endpoint: "https://github.com/login/oauth/access_token",
    requested_scopes: "repo user"
  }

  function renderTemplate(content){
          let html = `<!DOCTYPE html>
                      <html>
                        <head>
                          <base target="_top">
                        </head>
                        <body>
                        <div>
                          ${content}
                        </div>
                      </body>
                      </html>`  
          return html  
  }

  if(!code || !state){

      let state = ""
      const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
      for (let i = 0; i < 128; i++) {
        state += possible.charAt(Math.floor(Math.random() * possible.length))
      }

      const cache = CacheService.getScriptCache()
      cache.put('state', state)

      var url = auth_config.authorization_endpoint 
          + "?"
          + "&client_id="+encodeURIComponent(auth_config.client_id)
          + "&state="+encodeURIComponent(state)
          + "&scope="+encodeURIComponent(auth_config.requested_scopes)
          + "&redirect_uri="+encodeURIComponent(auth_config.redirect_uri)
   
      let html = `<a id="redirect" href="${url}">Github</a>`
      html = renderTemplate(html)
      return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 

  }else{

      function renderScript(status, content) {
          const html = `
          <script>
            const receiveMessage = (message) => {
              window.parent.parent.opener.postMessage(
                'authorization:github:${status}:${JSON.stringify(content)}',
                message.origin
              );
              window.removeEventListener("message", receiveMessage, false);
            }
            window.addEventListener("message", receiveMessage, false);
            window.parent.parent.opener.postMessage("authorizing:github", "*");
          </script>
          `
          return html
      }

      const cache = CacheService.getScriptCache()
      const cached = cache.get('state')
      if (cached != null && cached == state) {

          const data = {
            client_id: auth_config.client_id,
            client_secret: auth_config.client_secret,
            code,
          };
          const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(data),
            headers:{
              accept: 'application/json'
            }
          };

          const response = UrlFetchApp.fetch(auth_config.token_endpoint, options); 

          const result = JSON.parse(response)

          if(result.access_token){
              const token = result.access_token;
              const provider = 'github';            
              let html = `Success ${renderScript('success', {token,provider})}`
              html = renderTemplate(html)
              return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 
          }else{
              let html = `Error : ${response} ${renderScript('error', result)}`
              html = renderTemplate(html)
              return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 
          }

      }else{

          let html = `<a id="redirect" href="${auth_config.redirect_uri}">Home</a>`
          html = renderTemplate(html)
          return HtmlService.createHtmlOutput(html).setSandboxMode(HtmlService.SandboxMode.IFRAME) 

      }    
  }
}
