function openTab(evt, tabName) {

  // get all elements with class="tabcontent" and hide them except the first one
  const tabcontent = document.getElementsByClassName('products-feed__tabcontent');
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none';
  }

  // get all elements with class="tablinks" and remove the class "active" except the first one
  const tablinks = document.getElementsByClassName('products-feed__tablinks');
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(
      ' active',
      ''
    );
  }

  // show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = 'block';
  evt.currentTarget.className += ' active';


}
// show the first tab by default on load
document.getElementById('defaultOpen').click();
