function doGet(e) {
	const jsonString = HtmlService.createHtmlOutputFromFile("config.html").getContent()
	const jsonObject = JSON.parse(jsonString)
	if(jsonObject.github_client_id && jsonObject.github_client_secret){
		PropertiesService.getScriptProperties().setProperty('github_client_id', jsonObject.github_client_id)
		PropertiesService.getScriptProperties().setProperty('github_client_secret', jsonObject.github_client_secret)
	}
	Logger.log(jsonObject)
}
