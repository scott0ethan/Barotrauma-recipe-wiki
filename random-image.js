
// Safely pass the Jinja array to JavaScript
const imageList = [
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7hJaeTfh9uv_Br02hYiw0KfYMgeOojOAlHDie3oWJKg&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9k5Koh3DbCJHGo44l1hUSumFgIGc9DENWbi8OSIx8og&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1H1i8wd0iONQ7ROxTFngaXgUOKW-uXWmqzvckM2_uCA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRInxd5R4pvWlAXroWxdZD9wX7vktex-1XN0M7EvT5axg&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnJFeumVbSWz208DbMb9VUbmks_ZTLdWHNcOHtxvRZew&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsvfb2UfWL4_sP0SgDUjKqtgSj2w5vV9cRflvP_qz1oQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR571yTe_eL3oiRGyu2URhzcoxMmZND0UYonkuQzbi0TQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzHEqfePlUlot2b0pYjQiRDEszw8Py5q55FuLV1lPlEQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBo-q4rETuS6RF9CY48ucfBX7hgB2y_Fi0G65AL39K3A&s',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuHRiVpL_XDZtPUtftHktQvpss4hUMhYtPj3ivAiEHoQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJGPJS5j8HW_QJGqvh0tmk4eTxkAh29k1Ey_7Odu0qOQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTj6vYytBvoUj1upa_UECDlsoJwC3TV0f8wl3i7XXP4pw&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeEEaNbp418-cQDNy6VfwcXZ0OvAcZMCdymPDgqsrWcg&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdYnF8yzD28VrSzQFN5YwZnEl5eiEh36ymq6frAaHvIQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCvM1hBUicHcLCyUevf1V3fPlMwgT6YMfJLP5mDOpSgA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNHpFYrZpksLuKGLD60lucCu-xKpF3bkihvDEB_BVUgQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-69EiiBh3dhT6IZkWRbvLY2gqqJTgceLn3JN6Qy_RGQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmRJ3xGpflABcrwhz-_kEd9jnPfM3vEcjKAwsTDztSYQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuDM1mnVjSRsXY_tijxZzHeTFOz1dUHN0sIWZIUa0HgQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQs8yoA2CBTa8mzGeoBjRbylvTKQILZ5JFEixOg0fGDKg&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRe--3cSxOl9RO049X1WTi2P3rgmLH8qaoMyyyS5DY9JA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4yIoC4td0ngyXqTukHFAtGlsW_H_Oh6bt3OyFFB0VhA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkaDS2gOmOKJEAtExpMDPX5x1ZziUIo1FQ32J7-76nig&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUC8jDsJyyFcWVUNnapdt4IGtxnNH9bTlEnkqdzuCFTQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkb28E4K_bg5uNVAFHo_uTrU1_E0hLdt991L3Ao5t_Yg&s',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJYj2XeZgMuSo_77ifKQntljzZDWWsaJXxvC1dqc0NDw&s',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwsfgPYP9H0Cz_9uZTiQv9FUuACcBNl-r83kVsaQFdHA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJPCrp4UC_rx27MUiv5k90ElKLm_qYGZP5i8-tI6G1kg&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAvI6H38aHA69isQuKI5t6QVno4u2Z8LG9kyDquL0j_A&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSN-iGDng6FwQwZIf7JAmYvl1Uqe6gSjPHan3RR2XL8yQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7NToXLZt7U9KNrS6CrfOoOjgGK-eleOtW8RegwWo_jA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPTLtG8yGFt2oS5-eMuYxDhntWsOreMWaYHDPepg2pmA&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdwhBiyWHD-OHPZyeMFPYON52gOz8dLiZbk0IybLoy5w&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQh10FiT0mqQwC5IcRCGyaR69752_Z0P6IEME0Wo148w&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjzbqoKVp5qNLYLMCpoiaTUQx2juXFqyFGMCSNyso1Pw&s',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR50n9ucU46y0PcnROhvSw87PKir3-CNGy38Rndo6WYw&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1DVAiAZAmFy7RBr3g_WiwmDCOqh8PU1X4nuV31VmW1w&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRHEMERLotpBt9buY5OFK9Iu17UKhbQ_u-vN1V2czS-gA&s',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv3u5t25hpv8GUU5Wp7k8DDgBRRWoikKs0jGZC34lADQ&s',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlj5Ah0TGhbMDwWF--Gr8psGcWHrjR6uynDCZziUdpOQ&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMZwaSu391gZOePzk5dFbFswfBgOLXsG-m53EtFk5vJw&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDjt_toh32FFhz_0SwzBhRzndJznPYOLol8V-7k9Sqww&s=10',
	'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3rSTyrJrcM1Kjkboi-efM2ZiHszc7MGXvd0o9wTdEQw&s=10'
];

if (imageList && imageList.length > 0) {
	const randomIndex = Math.floor(Math.random() * imageList.length);
	const selectedUrl = imageList[randomIndex];
	
	const container = document.getElementById("image-container");	
	container.innerHTML = `<img src="${selectedUrl}" alt="meow" style="width: 100%; height: auto; max-height: 100px; margin: 0 auto">`;
}