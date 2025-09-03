$(document).ready(function() {
  const coordenadasFixas = {
    "Getúlio Vargas": { latitude: -27.89, longitude: -52.23 }
  };

  function canonicalize(nome) {
    return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "");
  }

  function formatarCidade(nome) {
    return nome.toLowerCase().replace(/([a-z])([A-Z])/g, "$1 $2").trim().replace(/\s+/g, " ").split(" ").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }

  function salvarCidades(cidades) {
    localStorage.setItem("cidades", JSON.stringify(cidades));
  }

  function carregarCidades() {
    let salvas = JSON.parse(localStorage.getItem("cidades"));
    if (salvas && salvas.length) return salvas.map(formatarCidade);
    return ["Getúlio Vargas", "São Paulo", "Rio de Janeiro", "Porto Alegre", "Curitiba"];
  }

  function atualizarLista() {
    $("#listaCidades").empty();
    cidades.forEach((cidade, index) => {
      let item = $("<li>").addClass("list-group-item list-group-item-action bg-dark text-white d-flex justify-content-between align-items-center").attr("data-cidade", cidade);
      let span = $("<span>").text(cidade);
      let btnRemover = $("<button>").addClass("btn-remove").html("❌").click(function(e) {
        e.stopPropagation();
        cidades.splice(index,1);
        salvarCidades(cidades);
        atualizarLista();
      });
      item.append(span).append(btnRemover);
      $("#listaCidades").append(item);
    });
  }

  function mostrarImagens(cidade, latitude, longitude) {
    $("#imagensCidade").empty();
    function fallbackBusca() {
      let categoria = canonicalize(cidade) === canonicalize("Getúlio Vargas") ? "Getúlio_Vargas,_Rio_Grande_do_Sul" : cidade.replace(/\s+/g, "_");
      let urlCategoria = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=categorymembers&gcmtitle=${encodeURIComponent("Category:" + categoria)}&gcmtype=file&gcmlimit=9&prop=imageinfo&iiprop=url&iiurlwidth=400&origin=*`;
      $.getJSON(urlCategoria, function(data) {
        if (data.query && data.query.pages) {
          let pages = Object.values(data.query.pages);
          pages.forEach(p => {
            if (p.imageinfo && p.imageinfo.length > 0) {
              let col = $("<div>").addClass("col-6 col-md-4");
              let imagem = $("<img>").attr("src", p.imageinfo[0].thumburl || p.imageinfo[0].url);
              col.append(imagem);
              $("#imagensCidade").append(col);
            }
          });
        }
        if (!$("#imagensCidade img").length) {
          let termoBusca = canonicalize(cidade) === canonicalize("Getúlio Vargas") ? "\"Getúlio Vargas, Rio Grande do Sul\"|\"Getúlio Vargas (Rio Grande do Sul)\"" : cidade;
          let urlBusca = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(termoBusca)}&gsrlimit=9&pithumbsize=400&origin=*`;
          $.getJSON(urlBusca, function(dados) {
            if (dados.query && dados.query.pages) {
              let pages = Object.values(dados.query.pages);
              pages.forEach(p => {
                if (p.thumbnail && p.thumbnail.source) {
                  let col = $("<div>").addClass("col-6 col-md-4");
                  let imagem = $("<img>").attr("src", p.thumbnail.source);
                  col.append(imagem);
                  $("#imagensCidade").append(col);
                }
              });
            } else {
              $("#imagensCidade").html("<p>Nenhuma imagem encontrada da cidade.</p>");
            }
          });
        }
      });
    }

    if (typeof latitude === "number" && typeof longitude === "number") {
      let urlGeoImgs = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=geosearch&ggscoord=${latitude}%7C${longitude}&ggsradius=20000&ggslimit=9&ggsnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=400&origin=*`;
      $.getJSON(urlGeoImgs, function(geoImgs) {
        if (geoImgs.query && geoImgs.query.pages) {
          let pages = Object.values(geoImgs.query.pages);
          pages.forEach(p => {
            if (p.imageinfo && p.imageinfo.length > 0) {
              let col = $("<div>").addClass("col-6 col-md-4");
              let imagem = $("<img>").attr("src", p.imageinfo[0].thumburl || p.imageinfo[0].url);
              col.append(imagem);
              $("#imagensCidade").append(col);
            }
          });
          if ($("#imagensCidade img").length) return;
        }
        fallbackBusca();
      }).fail(fallbackBusca);
    } else {
      fallbackBusca();
    }
  }

  function buscarClima(cidade) {
    let matchedKey = Object.keys(coordenadasFixas).find(k => canonicalize(k) === canonicalize(cidade));
    if (matchedKey) {
      let { latitude, longitude } = coordenadasFixas[matchedKey];
      let urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      $.getJSON(urlClima, function(dados) {
        let temp = dados.current_weather.temperature;
        let condicao = dados.current_weather.weathercode;
        $("#nomeCidade").text(matchedKey);
        $("#temperatura").text(temp + " °C");
        $("#condicao").text("Código clima: " + condicao);
        $("#resultado").removeClass("d-none").hide().fadeIn(800);
        mostrarImagens(matchedKey, latitude, longitude);
      });
      return;
    }
    let urlGeo = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=5&language=pt&format=json`;
    $.getJSON(urlGeo, function(geo) {
      if (!geo.results || geo.results.length === 0) {
        alert("Cidade não encontrada!");
        return;
      }
      let cidadeAlvo = geo.results.find(r => r.country_code === "BR") || geo.results[0];
      let latitude = cidadeAlvo.latitude;
      let longitude = cidadeAlvo.longitude;
      let nomeCidade = cidadeAlvo.name;
      let urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      $.getJSON(urlClima, function(dados) {
        let temp = dados.current_weather.temperature;
        let condicao = dados.current_weather.weathercode;
        $("#nomeCidade").text(nomeCidade);
        $("#temperatura").text(temp + " °C");
        $("#condicao").text("Código clima: " + condicao);
        $("#resultado").removeClass("d-none").hide().fadeIn(800);
        mostrarImagens(nomeCidade, latitude, longitude);
      });
    });
  }

  let cidades = carregarCidades();
  atualizarLista();

  $(document).on("click", "#listaCidades li", function(e) {
    if (!$(e.target).hasClass("btn-remove")) {
      let cidade = $(this).data("cidade");
      buscarClima(cidade);
    }
  });

  $("#adicionarCidade").click(function() {
    let novaCidadeRaw = $("#novaCidade").val().trim();
    if (novaCidadeRaw === "") {
      alert("Digite uma cidade para adicionar!");
      return;
    }
    let urlGeo = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(novaCidadeRaw)}&count=5&language=pt&format=json`;
    $.getJSON(urlGeo, function(geo) {
      let nomePadronizado = formatarCidade(novaCidadeRaw);
      if (geo && geo.results && geo.results.length) {
        let res = geo.results.find(r => r.country_code === "BR") || geo.results[0];
        if (res && res.name) nomePadronizado = res.name;
      }
      if (cidades.some(c => canonicalize(c) === canonicalize(nomePadronizado))) {
        alert("Essa cidade já está na lista!");
        return;
      }
      cidades.push(nomePadronizado);
      salvarCidades(cidades);
      atualizarLista();
      $("#novaCidade").val("");
    });
  });

  $("#limpar").click(function() {
    $("#resultado").fadeOut(500, function() {
      $("#nomeCidade").text("--");
      $("#temperatura").text("-- °C");
      $("#condicao").text("--");
      $("#imagensCidade").empty();
    });
  });

  setInterval(function() {
    let drop = $("<div class='drop'></div>");
    drop.css({
      left: Math.random() * $(".rain").width() + "px",
      animationDuration: (0.5 + Math.random() * 0.7) + "s"
    });
    $(".rain").append(drop);
    setTimeout(() => drop.remove(), 2000);
  }, 100);
});
