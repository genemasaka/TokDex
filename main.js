//Moralis server details
const serverUrl = "https://kymrn497y3ee.usemoralis.com:2053/server";
const appId = "swExlTh7dJMnb9CGcFASmssAeieqTJZwB9puogms";
//Instatiating Moralis server 
Moralis.start({ serverUrl, appId });
//stores the current token trade
let currentTrade ={};
//stores the current selected side
let currentSelectedSide;
//initializes tokens variable
let tokens;

async function init(){
  await Moralis.initPlugins();
  await Moralis.enableWeb3();
  await listAvailableTokens();

}
//Gets all the tokens from oneInch and adds them to the app.
async function listAvailableTokens(){
  const result = await Moralis.Plugins.oneInch.getSupportedTokens({chain: 'eth'});
   tokens = result.tokens;
  let parent = document.getElementById("token_list");

  for(const address in tokens){
    let token = tokens[address];

    let div = document.createElement("div");
    div.setAttribute("data-address", address);
    div.className = "token_row";
    let html = `
    <img class="token_list_img" src="${token.logoURI}">
    <span class="token_list_symbol">${token.symbol}</span>
    `
    div.innerHTML = html;
    div.onclick = selectToken;
    parent.appendChild(div);
  }
}
//Allows user to select tokens they want to exhange
 function selectToken(){
  closeModal();
  let address = event.target.getAttribute("data-address");
  console.log(address);
  currentTrade[currentSelectedSide]= tokens[address];
  console.log(currentTrade);
  renderInterface();
  retreiveQuote();
}
//Renders the token symbols and images in modal
function renderInterface(){
  if(currentTrade.from){
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_symbol").innerHTML= currentTrade.from.symbol;
}
  
  if(currentTrade.to){
  document.getElementById("to_token_img").src = currentTrade.to.logoURI;
  document.getElementById("to_token_symbol").innerHTML= currentTrade.to.symbol;
}
}

//signs in the user using MetaMask
async function login() {
  let user = Moralis.User.current();
  if (!user) {
   try {
      user = await Moralis.authenticate({ signingMessage: "Sign in to TokDEX" })
      console.log(user)
      console.log(user.get('ethAddress'))
   } catch(error) {
     console.log(error)
   }
  }
}
//Logs out the user 
async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
}
//Opens a modal that allows users to select tokens to exchange
function openModal(side){
  currentSelectedSide = side;
  document.getElementById("token_modal").style.display = "block";
}
//Closes modal that contains tokens list
function closeModal(){
  document.getElementById("token_modal").style.display = "none";
}
//Gets token exchange quote from oneInch 
async function retreiveQuote(){
  if(!currentTrade.from||!currentTrade.to|| !document.getElementById("from_amount").value)
  return;
  let amount = Number(document.getElementById("from_amount").value *10**currentTrade.from.decimals);
  
  const quote = await Moralis.Plugins.oneInch.quote({
    chain: 'eth',
    fromTokenAddress: currentTrade.from.address,
    toTokenAddress: currentTrade.to.address,
    amount: amount
  });
  console.log(quote);
  document.getElementById("gastimate").innerHTML = quote.estimatedGas;
  document.getElementById("to_amount").value = quote.toTokenAmount / (10**quote.toToken.decimals);
}
//Checks allowance 
async function attemptSwap(){
  let address = Moralis.User.current().get("ethAddress");
  console.log(address);
  let amount = Number(document.getElementById("from_amount").value *10**currentTrade.from.decimals);
  if(currentTrade.symbol !== 'ETH') {
   
    const allowance = await Moralis.Plugins.oneInch.hasAllowance({
    chain: 'eth',
    fromTokenAddress: currentTrade.from.address,
    toTokenAddress: address,
    amount: amount
    });
    console.log(allowance);
    if(!allowance){
      await Moralis.Plugins.oneInch.approve({
        chain: 'eth',
        fromTokenAddress: currentTrade.from.address,
        toTokenAddress: address,
        amount: amount
        });
    }
  }
  let receipt = await completeSwap(address, amount);
  alert("Token Exchange Completed!")
}
  //Does the token exchange 
 function completeSwap(userAddress, amount){
  
    return Moralis.Plugins.oneInch.swap({
      chain: 'eth',
      fromTokenAddress:  currentTrade.from.address, 
      toTokenAddress:  currentTrade.to.address,
      amount: amount,
      fromAddress: userAddress, 
      slippage: 1,
    });



}

init();
//Event listeners 
document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;
document.getElementById("close_modal").onclick = closeModal;
document.getElementById("from_token_selector").onclick = (()=>{openModal("from")});
document.getElementById("to_token_selector").onclick = (()=>{openModal("to")});
document.getElementById("from_amount").onblur = retreiveQuote;
document.getElementById("swap_btn").onclick = attemptSwap;
