if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
         for (var i = (start || 0), j = this.length; i < j; i++) {
             if (this[i] === obj) { return i; }
         }
         return -1;
    };
}


String.prototype.format = function() {
	var args = arguments;
	return this.replace(/\{(\d+)\}/g, function (m, n) {return args[n]; });
};


$(document).ready(function() {
   /* FIX NAV SCROLL */
	var stickyOffset = $('.sticky').offset().top;
	$(window).scroll(function(){
		var sticky = $('.sticky'),
		scroll = $(window).scrollTop();
	  	if (scroll >= stickyOffset) {
			sticky.addClass('navbar-fixed-top');
		}
	  	else {
			sticky.removeClass('navbar-fixed-top');
		}
	});
});