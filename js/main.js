var apiRoot = "https://api.github.com/";

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for(var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable) {
            return pair[1];
        }
    }
    return "";
}

// Validate the user input
function validateInput() {
    if ($("#username").val().length > 0 && $("#repository").val().length > 0) {
        $("#get-stats-button").prop("disabled", false);
    } else {
        $("#get-stats-button").prop("disabled", true);
    }
}

// Focus on #username when document is ready
$(document).ready(function() {
    if (!$("#username").val()) {
        $("#username").focus();
    }
});

// Callback function for getting user repositories
function getUserRepos() {
    var user = $("#username").val();

    var autoComplete = $('#repository').typeahead();
    var repoNames = [];

    var url = apiRoot + "users/" + user + "/repos";
    $.getJSON(url, function(data) {
        $.each(data, function(index, item) {
            repoNames.push(item.name);
        });
    });

    autoComplete.data('typeahead').source = repoNames;
}

// Display the stats
function showStats(data) {

    var err = false;
    var errMessage = '';

    if(data.status == 404) {
        err = true;
        errMessage = "The project does not exist!";
    }

    if(data.status == 403) {
        err = true;
        errMessage = "You've exceeded GitHub's rate limiting.<br />Please try again in about an hour.";
    }

    if(data.length == 0) {
        err = true;
        errMessage = "There are no releases for this project";
    }

    var html = '';

    if(err) {
        html = "<div class='col-md-6 col-md-offset-3 error output'>" + errMessage + "</div>";
    } else {
        html += "<div class='col-md-6 col-md-offset-3 output'>";
        var latest = true;
        var totalDownloadCount = 0;

        // Set title to username/repository
        document.title = $("#username").val() + "/" + $("#repository").val() + " - " + document.title;

        // Sort by publish date
        data.sort(function (a, b) {
            return (a.published_at < b.published_at) ? 1 : -1;
        });

        $.each(data, function(index, item) {
            var releaseTag = item.tag_name;
            var releaseURL = item.html_url;
            var releaseAssets = item.assets;
            var hasAssets = releaseAssets.length != 0;
            var releaseAuthor = item.author;
            var hasAuthor = releaseAuthor != null;
            var publishDate = item.published_at.split("T")[0];
            var ReleaseDownloadCount = 0;

            if(latest) {
                html += "<div id='latest' class='row release latest-release'>" +
                    "<h2><a href='" + releaseURL + "' target='_blank'>" +
                    "<span class='glyphicon glyphicon-tag'></span>&nbsp&nbsp" +
                    "最新版本 | " + releaseTag +
                    "</a></h2><hr class='latest-release-hr'>";
                latest = false;
            } else {
                html += "<div id='" + releaseTag + "' class='row release'>" +
                    "<h4><a href='" + releaseURL + "' target='_blank'>" +
                    "<span class='glyphicon glyphicon-tag'></span>&nbsp&nbsp" +
                    releaseTag +
                    "</a></h4><hr class='release-hr'>";
            }

            if(hasAssets) {
                var downloadInfoHTML = "<h4><span class='glyphicon glyphicon-download'></span>" +
                    "&nbsp&nbsp下載資訊：</h4>";
                downloadInfoHTML += "<ul>";
                html += "<ul>";
                $.each(releaseAssets, function(index, asset) {
                    var assetSize = (asset.size / 1048576.0).toFixed(2).replace(/\./, ',');
                    var lastUpdate = asset.updated_at.split("T")[0];
                    downloadInfoHTML += "<li><a href=\"" + asset.browser_download_url + "\">" + "<span style='font-size: 2.5rem;line-break: anywhere;'>" + asset.name + "</span></a> <small style='font-size: 12px'>(" + assetSize + " MiB)</small><br>" +
                        "<i>最後更新 " + lastUpdate + " &mdash; " +
                        asset.download_count.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1&#8239;');
                    asset.download_count == 1 ? downloadInfoHTML += " 次下載</i></li>" : downloadInfoHTML += " 次下載</i></li>";
                    totalDownloadCount += asset.download_count;
                    ReleaseDownloadCount += asset.download_count;
                });
            }
            else {
                downloadInfoHTML = "<center><i>這個版本沒有可以下載的檔案！</i></center>"
            }

            //html += "<h4><span class='glyphicon glyphicon-info-sign'></span>&nbsp&nbsp" + "Release Info:</h4>";

            //html += "<ul style=\"list-style-type:none\">";

            //html += "<li><span class='glyphicon glyphicon-calendar'></span>&nbsp&nbspPublished on: " + publishDate + "</li>";

            //if(hasAuthor) {
            //    html += "<li><span class='glyphicon glyphicon-user'></span>&nbsp&nbspRelease Author: " +
            //        "<a href='" + releaseAuthor.html_url + "'>" + releaseAuthor.login +"</a><br></li>";
            //}

            //if(hasAssets) {
            //    html += "<li><span class='glyphicon glyphicon-download'></span>&nbsp&nbspDownloads: " +
            //    ReleaseDownloadCount.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1&#8239;') + "</li>";
            //}

            //html += "</ul>";

            html += downloadInfoHTML;

            html += "</div>";
        });

        if(totalDownloadCount > 0) {
            totalDownloadCount = totalDownloadCount.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1&#8239;');
            var totalHTML = "<div class='row total-downloads'>";
            totalHTML += "<h2><span class='glyphicon glyphicon-download'></span>" +
                "&nbsp&nbsp總下載數</h2> ";
            totalHTML += "<span>" + totalDownloadCount + "</span>";
            totalHTML += "</div>";
            html = totalHTML + html;
        }
		html = "<div class='row total-downloads'><h1>" + $("#repository").val() + "  releases</h1></div>" + html

        html += "</div>";
    }

    var resultDiv = $("#stats-result");
    resultDiv.hide();
    resultDiv.html(html);
    $("#loader-gif").hide();
    resultDiv.slideDown();
}

// Callback function for getting release stats
function getStats() {
    var user = $("#username").val();
    var repository = $("#repository").val();

    var url = apiRoot + "repos/" + user + "/" + repository + "/releases";
    $.getJSON(url, showStats).fail(showStats);
}

// The main function
$(function() {
    $("#loader-gif").hide();

    validateInput();
    $("#username, #repository").keyup(validateInput);

    $("#username").change(getUserRepos);

    $("#get-stats-button").click(function() {
        window.location = "?username=" + $("#username").val() +
            "&repository=" + $("#repository").val();
    });

    $('#repository').on('keypress',function(e) {
        if(e.which == 13) {
            window.location = "?username=" + $("#username").val() +
            "&repository=" + $("#repository").val();
        }
    });

    var username = getQueryVariable("username");
    var repository = getQueryVariable("repository");

    if(username != "" && repository != "") {
        $("#username").val(username);
        $("#repository").val(repository);
        validateInput();
        getUserRepos();
        $(".output").hide();
        $("#description").hide();
        $("#loader-gif").show();
        getStats();
    }
});
