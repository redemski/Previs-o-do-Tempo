$(document).ready(function() {
  function buscarClima(cidade) {
    let urlGeo = `https://geocoding-api.open-meteo.com/v1/search?name=${cidade}&count=1&language=pt&format=json`;
    $.getJSON(urlGeo, function(geo) {
      if (!geo.results || geo.results.length === 0) {
        alert("Cidade não encontrada!");
        return;
      }
      let latitude = geo.results[0].latitude;
      let longitude = geo.results[0].longitude;
      let nomeCidade = geo.results[0].name;
      let urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
      $.getJSON(urlClima, function(dados) {
        let temp = dados.current_weather.temperature;
        let condicao = dados.current_weather.weathercode;
        $("#nomeCidade").text(nomeCidade);
        $("#temperatura").text(temp + " °C");
        $("#condicao").text("Código clima: " + condicao);
        $("#resultado").removeClass("d-none").hide().fadeIn(800);
      });
    });
  }

  function salvarCidades(cidades) {
    localStorage.setItem("cidades", JSON.stringify(cidades));
  }

  function carregarCidades() {
    return ["São Paulo", "Rio de Janeiro", "Porto Alegre", "Curitiba"];
  }

  function atualizarLista() {
    $("#listaCidades").empty();
    cidades.forEach((cidade, index) => {
      let item = $("<li>")
        .addClass("list-group-item list-group-item-action bg-dark text-white")
        .attr("data-cidade", cidade);

      let span = $("<span>").text(cidade);
      let btnRemover = $("<button>")
        .addClass("btn-remove")
        .html("❌")
        .click(function(e) {
          e.stopPropagation();
          cidades.splice(index, 1);
          salvarCidades(cidades);
          atualizarLista();
        });

      item.append(span).append(btnRemover);
      $("#listaCidades").append(item);
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

  function formatarCidade(nome) {
    return nome
      .toLowerCase()
      .split(" ")
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }

  $("#adicionarCidade").click(function() {
    let novaCidade = $("#novaCidade").val().trim();
    if(novaCidade === "") {
      alert("Digite uma cidade para adicionar!");
      return;
    }
    novaCidade = formatarCidade(novaCidade);
    cidades.push(novaCidade);
    salvarCidades(cidades);
    atualizarLista();
    $("#novaCidade").val("");
  });

  $("#limpar").click(function() {
    $("#resultado").fadeOut(500, function() {
      $("#nomeCidade").text("--");
      $("#temperatura").text("-- °C");
      $("#condicao").text("--");
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