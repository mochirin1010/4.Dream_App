$(function(){

  $('.top-btn').hide();
  
  $(window).scroll(function(){
    if($(this).scrollTop()>200){
      $('.top-btn').fadeIn();
    }else{
      $('.top-btn').fadeOut();
    }
  });

  $('.top-btn').click(function(){
    $('body,html').animate({scrollTop: 0},500);
    return false;
  });

});