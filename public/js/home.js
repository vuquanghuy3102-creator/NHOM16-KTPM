const PROVINCES=["An Giang","Bắc Ninh","Cà Mau","Cao Bằng","Cần Thơ","Đà Nẵng","Đắk Lắk","Điện Biên","Đồng Nai","Đồng Tháp","Gia Lai","Hà Nội","Hà Tĩnh","Hải Phòng","Huế","Hưng Yên","Khánh Hòa","Lai Châu","Lâm Đồng","Lạng Sơn","Lào Cai","Nghệ An","Ninh Bình","Phú Thọ","Quảng Ngãi","Quảng Ninh","Quảng Trị","Sơn La","Tây Ninh","Thanh Hóa","Thái Nguyên","TP. Hồ Chí Minh","Tuyên Quang","Vĩnh Long"];

async function loadHotels(query=""){
 const list=document.getElementById("hotelList"); list.innerHTML=`<p>${escapeHtml(t("loading_hotels"))}</p>`;
 try{
  const result=await api(`/hotels${query}`);
  if(!result.data.length){list.innerHTML=`<p>${escapeHtml(t("no_hotels"))}</p>`;return;}
  list.innerHTML=result.data.map(h=>`<article class="card hotel-card">
  <img src="${escapeHtml(h.image||'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80')}" alt="${escapeHtml(h.name)}">
  <div class="card-body"><div class="star">${"★".repeat(h.star_rating)}${"☆".repeat(5-h.star_rating)}</div>
  <h3>${escapeHtml(h.name)}</h3><div class="hotel-meta"><span>${escapeHtml(h.city)}</span><span>${h.room_count} ${escapeHtml(t("rooms"))}</span></div>
  <p>${escapeHtml(h.description||"")}</p><p>${escapeHtml(t("from"))} <span class="price">${money(h.min_price)}</span> ${escapeHtml(t("per_night"))}</p>
  <a class="btn btn-primary" href="/hotel.html?id=${h.id}">${escapeHtml(t("view_details"))}</a></div></article>`).join("");
 }catch(e){list.innerHTML=`<p>${escapeHtml(e.message)}</p>`;}
}
function setupProvincePicker(){
 const input=document.getElementById("provinceInput"), hidden=document.getElementById("provinceValue"), panel=document.getElementById("provinceSuggestions");
 function render(filter=""){const f=filter.trim().toLocaleLowerCase("vi");const m=PROVINCES.filter(x=>x.toLocaleLowerCase("vi").includes(f));
 panel.innerHTML=m.map(x=>`<div class="province-option" data-value="${escapeHtml(x)}">${escapeHtml(x)}</div>`).join("");panel.classList.add("show");}
 input.addEventListener("focus",()=>render(input.value));input.addEventListener("input",()=>{hidden.value="";render(input.value);});
 panel.addEventListener("click",e=>{const o=e.target.closest(".province-option");if(!o)return;input.value=o.dataset.value;hidden.value=o.dataset.value;panel.classList.remove("show");});
 document.addEventListener("click",e=>{if(!e.target.closest(".province-picker"))panel.classList.remove("show");});
}
function setupPriceRange(){
 const minR=document.getElementById("minPriceRange"),maxR=document.getElementById("maxPriceRange"),minH=document.getElementById("minPrice"),maxH=document.getElementById("maxPrice"),minL=document.getElementById("minPriceLabel"),maxL=document.getElementById("maxPriceLabel");
 function sync(changed){let min=+minR.value,max=+maxR.value;if(min>max){if(changed==="min")max=min;else min=max;}minR.value=min;maxR.value=max;minH.value=min;maxH.value=max;minL.textContent=money(min);maxL.textContent=money(max);}
 minR.addEventListener("input",()=>sync("min"));maxR.addEventListener("input",()=>sync("max"));sync();
}
document.addEventListener("DOMContentLoaded",()=>{
 setupProvincePicker();setupPriceRange();loadHotels();
 document.getElementById("hotelSearchForm").addEventListener("submit",e=>{e.preventDefault();const d=new FormData(e.currentTarget),p=new URLSearchParams();for(const[k,v]of d.entries())if(String(v).trim()!=="")p.set(k,v);loadHotels(`/search?${p}`);});
 document.getElementById("resetSearch").addEventListener("click",()=>{document.getElementById("keyword").value="";document.getElementById("provinceInput").value="";document.getElementById("provinceValue").value="";document.getElementById("minPriceRange").value="0";document.getElementById("maxPriceRange").value="3000000";document.getElementById("minPrice").value="0";document.getElementById("maxPrice").value="3000000";document.getElementById("minPriceLabel").textContent=money(0);document.getElementById("maxPriceLabel").textContent=money(3000000);loadHotels();});
});
