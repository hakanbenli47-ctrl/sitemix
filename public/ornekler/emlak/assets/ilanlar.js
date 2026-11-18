window.ILANLAR=[{"no": 1, "title": "Denize 300 m, havuzlu site içinde 3+1", "type": "Daire", "deal": "Satılık", "price": "₺9.850.000", "area": 145, "rooms": "3+1", "loc": "Konyaaltı / Hurma", "floor": "3", "age": "2", "img": "ilan1.jpg"}, {"no": 2, "title": "Lara’da bahçeli tripleks villa", "type": "Villa", "deal": "Satılık", "price": "₺24.500.000", "area": 320, "rooms": "5+2", "loc": "Muratpaşa / Lara", "floor": "Bahçe", "age": "5", "img": "ilan2.jpg"}, {"no": 3, "title": "Eşyalı 1+1, üniversiteye yakın", "type": "Daire", "deal": "Kiralık", "price": "₺22.000 / ay", "area": 60, "rooms": "1+1", "loc": "Konyaaltı / Uncalı", "floor": "2", "age": "8", "img": "ilan3.jpg"}, {"no": 4, "title": "Cadde üzeri köşe dükkân", "type": "İş yeri", "deal": "Kiralık", "price": "₺65.000 / ay", "area": 120, "rooms": "—", "loc": "Muratpaşa / Fener", "floor": "Zemin", "age": "10", "img": "ilan4.jpg"}, {"no": 5, "title": "Deniz manzaralı 2+1 sıfır daire", "type": "Daire", "deal": "Satılık", "price": "₺7.400.000", "area": 105, "rooms": "2+1", "loc": "Konyaaltı / Liman", "floor": "6", "age": "0", "img": "ilan5.jpg"}, {"no": 6, "title": "İmarlı 520 m² villa arsası", "type": "Arsa", "deal": "Satılık", "price": "₺12.000.000", "area": 520, "rooms": "—", "loc": "Döşemealtı", "floor": "—", "age": "—", "img": "ilan6.jpg"}];
(function(){
  function card(x){return '<a class="card media listing" href="ilan.html?no='+x.no+'" style="text-decoration:none">'+
   '<figure class="ph"><img src="img/'+x.img+'" alt="" loading="lazy" onerror="this.remove()"><figcaption>img/'+x.img+'</figcaption></figure>'+
   '<div class="body"><span class="tag">'+x.deal+' · '+x.type+'</span><h3>'+x.title+'</h3><div class="price">'+x.price+'</div>'+
   '<div class="facts"><span>'+x.area+' m²</span><span>'+x.rooms+'</span><span>'+x.loc+'</span></div></div></a>';}
  var list=document.getElementById('ilan-list');
  if(list){
    var lim=parseInt(list.getAttribute('data-limit')||'0',10);
    var fd=document.getElementById('f-deal'),ft=document.getElementById('f-type');
    function render(){
      var d=fd?fd.value:'Tümü',t=ft?ft.value:'Tümü';
      var r=window.ILANLAR.filter(function(x){return (d==='Tümü'||x.deal===d)&&(t==='Tümü'||x.type===t);});
      if(lim)r=r.slice(0,lim);
      list.innerHTML=r.length?r.map(card).join(''):'<p class="muted">Bu kriterde ilan yok. Aradığınızı bize yazın, portföyümüzde olmayanları da buluyoruz.</p>';
    }
    var q=new URLSearchParams(location.search);
    if(fd&&q.get('islem'))fd.value=q.get('islem');
    [fd,ft].forEach(function(el){if(el)el.addEventListener('change',render);});
    render();
  }
  var det=document.getElementById('ilan-detay');
  if(det){
    var no=parseInt(new URLSearchParams(location.search).get('no')||'1',10);
    var x=window.ILANLAR.filter(function(i){return i.no===no;})[0]||window.ILANLAR[0];
    document.title=x.title+' | Kıyı Gayrimenkul';
    det.querySelectorAll('[data-k]').forEach(function(el){el.textContent=x[el.getAttribute('data-k')];});
    var im=det.querySelector('.ph img');im.src='img/'+x.img;det.querySelector('.ph figcaption code').textContent='img/'+x.img;
    var f=document.getElementById('ilan-no');if(f)f.value='#'+x.no+' – '+x.title;
  }
})();
