﻿window.onload = function () {
    "use strict";

    let updateLanguage = function (language) {
        document.getElementById("lnk-dashboard").innerHTML = language.get("lnk-dashboard");
        document.getElementById("lnk-manager").innerHTML = language.get("lnk-manager");
        document.getElementById("lnk-designer").innerHTML = language.get("lnk-designer");
        document.getElementById("lnk-history").innerHTML = language.get("lnk-history");
        document.getElementById("lnk-users").innerHTML = language.get("lnk-users");
        document.getElementById("lnk-profiles").innerHTML = language.get("lnk-profiles");
        document.getElementById("spn-logout").innerHTML = language.get("spn-logout");
    };

    let language = new Language("lang", updateLanguage);
    language.init();

    let uri = Common.trimEnd(Settings.Uri, "/");
    let lnkRecords = document.getElementById("lnk-records");
    let lnkManager = document.getElementById("lnk-manager");
    let lnkDesigner = document.getElementById("lnk-designer");
    let lnkApproval = document.getElementById("lnk-approval");
    let lnkUsers = document.getElementById("lnk-users");
    let lnkProfiles = document.getElementById("lnk-profiles");
    let lnkNotifications = document.getElementById("lnk-notifications");
    let imgNotifications = document.getElementById("img-notifications");
    let searchText = document.getElementById("search-records");
    let username = "";
    let password = "";
    let userProfile = -1;
    let auth = "";
    let modal = null;

    let suser = getUser();

    if (suser === null || suser === "") {
        Common.redirectToLoginPage();
    } else {
        let user = JSON.parse(suser);

        username = user.Username;
        password = user.Password;
        auth = "Basic " + btoa(username + ":" + password);

        Common.get(uri + "/user?username=" + encodeURIComponent(user.Username),
            function (u) {
                if (user.Password !== u.Password) {
                    Common.redirectToLoginPage();
                } else {
                    if (u.UserProfile === 0 || u.UserProfile === 1) {
                        Common.get(uri + "/hasNotifications?a=" + encodeURIComponent(user.Username), function (hasNotifications) {
                            lnkRecords.style.display = "inline";
                            lnkManager.style.display = "inline";
                            lnkDesigner.style.display = "inline";
                            lnkApproval.style.display = "inline";
                            lnkUsers.style.display = "inline";
                            lnkNotifications.style.display = "inline";

                            userProfile = u.UserProfile;
                            if (u.UserProfile === 0) {
                                lnkProfiles.style.display = "inline";
                            }

                            if (u.UserProfile === 1) {
                                document.getElementById("btn-delete").style.display = "none";
                            }

                            if (hasNotifications === true) {
                                imgNotifications.src = "images/notification-active.png";
                            } else {
                                imgNotifications.src = "images/notification.png";
                            }

                            let btnLogout = document.getElementById("btn-logout");
                            document.getElementById("navigation").style.display = "block";
                            document.getElementById("content").style.display = "block";

                            btnLogout.onclick = function () {
                                deleteUser();
                                Common.redirectToLoginPage();
                            };
                            document.getElementById("spn-username").innerHTML = " (" + u.Username + ")";

                            searchText.onkeyup = function (event) {
                                event.preventDefault();

                                if (event.keyCode === 13) { // Enter
                                    loadRecords();
                                }

                                return false;
                            };

                            loadRecords();

                        }, function () { }, auth);
                    } else {
                        Common.redirectToLoginPage();
                    }

                }
            }, function () { }, auth);

        function loadRecords() {
            let loadRecordsTable = function (records) {
                let items = [];
                for (let i = 0; i < records.length; i++) {
                    let record = records[i];
                    items.push("<tr>"
                        + "<td class='check' " + (userProfile == 1 ? "style='display: none;'" : "") + "><input type='checkbox'></td>"
                        + "<td class='id'>" + record.Id + "</td>"
                        + "<td class='name'>" + record.Name + "</td>"
                        + "<td class='approved'>" + "<input type='checkbox' " + (record.Approved === true ? "checked" : "") + " disabled>" + "</td>"
                        + "<td class='start-date'>" + (record.StartDate === "" ? "-" : record.StartDate) + "</td>"
                        + "<td class='end-date'>" + (record.EndDate === "" ? "-" : record.EndDate) + "</td>"
                        + "<td class='assigned-to'>" + (record.AssignedTo === "" ? "-" : record.AssignedTo) + "</td>"
                        + "<td class='assigned-on'>" + (record.AssignedOn === "" ? "-" : record.AssignedOn) + "</td>"
                        + "</tr>");

                }

                let table = "<table id='records-table' class='table'>"
                    + "<thead class='thead-dark'>"
                    + "<tr>"
                    + "<th class='check' " + (userProfile == 1 ? "style='display: none;'" : "") + "><input id='check-all' type='checkbox'></th>"
                    + "<th class='id'></th>"
                    + "<th id='th-assigned-by' class='name'>" + "Name" + "</th>"
                    + "<th id='th-assigned-on' class='approved'>" + "Approved" + "</th>"
                    + "<th id='th-message' class='start-date'>" + "Start date" + "</th>"
                    + "<th id='th-message' class='end-date'>" + "End date" + "</th>"
                    + "<th id='th-message' class='assigned-to'>" + "Assigned to" + "</th>"
                    + "<th id='th-message' class='assigned-on'>" + "Assigned on" + "</th>"
                    + "</tr>"
                    + "</thead>"
                    + "<tbody>"
                    + items.join("")
                    + "</tbody>"
                    + "</table>";

                let divNotifications = document.getElementById("content");
                divNotifications.innerHTML = table;

                let getRecord = function (recordId) {
                    for (let i = 0; i < records.length; i++) {
                        let record = records[i];
                        if (record.Id === recordId) {
                            return record;
                        }
                    }
                    return null;
                };

                let recordsTable = document.getElementById("records-table");
                let rows = recordsTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                let recordIds = [];

                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    let checkBox = row.getElementsByClassName("check")[0].firstChild;
                    checkBox.onchange = function () {
                        let currentRow = this.parentElement.parentElement;
                        let recordId = currentRow.getElementsByClassName("id")[0].innerHTML;
                        if (this.checked === true) {
                            recordIds.push(recordId);
                        } else {
                            recordIds = Common.removeItemOnce(recordIds, recordId);
                        }
                    };

                    row.onclick = function (e) {
                        if (e.target.type && e.target.type === "checkbox") {
                            return;
                        }
                        let recordId = this.getElementsByClassName("id")[0].innerHTML;
                        let record = getRecord(recordId);
                        let editedRecord = JSON.parse(JSON.stringify(record));
                        editedRecord.ModifiedBy = username;
                        let restrictEdit = userProfile === 1 && record.CreatedBy !== username;

                        if (modal) {
                            modal.destroy();
                        }

                        modal = new jBox('Modal', {
                            width: 800,
                            height: 420,
                            title: "Record information",
                            content: document.getElementById("edit-record").innerHTML,
                            footer: document.getElementById("edit-record-footer").innerHTML,
                            overlay: true,
                            //isolateScroll: false,
                            delayOpen: 0,
                            onOpen: function () {
                                let jBoxContent = document.getElementsByClassName("jBox-content")[0];
                                jBoxContent.querySelector(".record-id").value = record.Id;
                                jBoxContent.querySelector(".record-name").value = record.Name;
                                jBoxContent.querySelector(".record-description").innerHTML = record.Description;
                                jBoxContent.querySelector(".record-approved").checked = record.Approved;
                                jBoxContent.querySelector(".record-start-date").value = record.StartDate;
                                jBoxContent.querySelector(".record-end-date").value = record.EndDate;
                                jBoxContent.querySelector(".record-comments").innerHTML = record.Comments;
                                jBoxContent.querySelector(".record-manager-comments").innerHTML = record.ManagerComments;
                                jBoxContent.querySelector(".record-created-by").value = record.CreatedBy;
                                jBoxContent.querySelector(".record-created-on").value = record.CreatedOn;
                                jBoxContent.querySelector(".record-modified-by").value = record.ModifiedBy;
                                jBoxContent.querySelector(".record-modified-on").value = record.ModifiedOn;
                                jBoxContent.querySelector(".record-assigned-to").value = record.AssignedTo;
                                jBoxContent.querySelector(".record-assigned-on").value = record.AssignedOn;

                                if (restrictEdit === true) {
                                    jBoxContent.querySelector(".record-name").disabled = true;
                                    jBoxContent.querySelector(".record-description").disabled = true;
                                    jBoxContent.querySelector(".record-start-date").disabled = true;
                                    jBoxContent.querySelector(".record-end-date").disabled = true;
                                    jBoxContent.querySelector(".record-manager-comments").disabled = true;
                                }

                                let versions = [];
                                for (let i = 0; i < record.Versions.length; i++) {
                                    let version = record.Versions[i];
                                    versions.push("<tr>"
                                        + "<td class='version-id'>" + version.Id + "</td>"
                                        + "<td class='version-file-name'><a class='lnk-version-file-name' href='#'>" + version.FileName + "</a>" + (i === record.Versions.length - 1 ? "&nbsp;&nbsp;<span style='color: #28a745; border: 1px solid #34d058; border-radius: 2px; padding: 3px 4px;'>Latest version</span>" : "") + "</td>"
                                        + "<td class='version-created-on'>" + version.CreatedOn + "</td>"
                                        + "<td class='version-file-size'>" + version.FileSize + "</td>"
                                        + "<td class='version-delete'><input type='button' class='btn-delete-version btn btn-danger btn-xs' value='Delete'></td>"
                                        + "</tr>");
                                }
                                let versionsTable = jBoxContent.querySelector(".record-versions");
                                versionsTable.innerHTML = versions.join("");

                                // Download
                                let versionFiles = versionsTable.querySelectorAll(".lnk-version-file-name");
                                for (let i = 0; i < versionFiles.length; i++) {
                                    let versionFile = versionFiles[i];
                                    versionFile.onclick = function () {
                                        let versionId = this.parentElement.parentElement.querySelector(".version-id").innerHTML;
                                        let version = null;
                                        for (let j = 0; j < record.Versions.length; j++) {
                                            if (record.Versions[j].Id === versionId) {
                                                version = record.Versions[j];
                                                break;
                                            }
                                        }
                                        let url = "http://" + encodeURIComponent(username) + ":" + encodeURIComponent(password) + "@" + Settings.Hostname + ":" + Settings.Port + "/wexflow/downloadFile?p=" + encodeURIComponent(version.FilePath);
                                        window.open(url, "_self");
                                    };
                                }

                                // Delete version
                                let deleteVersionBtns = versionsTable.querySelectorAll(".btn-delete-version");
                                for (let i = 0; i < deleteVersionBtns.length; i++) {
                                    let deleteVersionBtn = deleteVersionBtns[i];
                                    deleteVersionBtn.onclick = function () {
                                        let versionId = this.parentElement.parentElement.querySelector(".version-id").innerHTML;
                                        let versionIndex = -1;
                                        for (let j = 0; j < editedRecord.Versions.length; j++) {
                                            if (editedRecord.Versions[j].Id === versionId) {
                                                versionIndex = j;
                                                break;
                                            }
                                        }
                                        if (versionIndex > -1) {
                                            editedRecord.Versions.splice(versionIndex, 1);
                                            // Update versions table
                                            let rows = versionsTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
                                            for (let j = 0; j < rows.length; j++) {
                                                let row = rows[j];
                                                let rowVersionId = row.querySelector(".version-id").innerHTML;
                                                if (rowVersionId === versionId) {
                                                    row.remove();
                                                }
                                            }
                                        }
                                    };
                                }

                                // Upload version
                                jBoxContent.querySelector(".btn-upload-version").onclick = function () {
                                    let filedialog = document.getElementById("file-dialog");
                                    filedialog.click();

                                    filedialog.onchange = function (e) {
                                        jBoxContent.querySelector(".spn-upload-version").innerHTML = "Uploading...";

                                        let file = e.target.files[0];
                                        let fd = new FormData();
                                        fd.append("file", file);

                                        Common.post(uri + "/uploadVersion?r=" + recordId, function (res) {
                                            if (res.Result === true) {
                                                editedRecord.Versions.push({
                                                    RecordId: recordId,
                                                    FilePath: res.FilePath,
                                                    FileName: res.FileName,
                                                    CreatedOn: ""
                                                });

                                                // Add row in .record-versions
                                                let row = versionsTable.insertRow(-1);
                                                let cell1 = row.insertCell(0);
                                                let cell2 = row.insertCell(1);
                                                let cell3 = row.insertCell(2);
                                                let cell4 = row.insertCell(3);
                                                let cell5 = row.insertCell(4);

                                                cell1.classList.add("version-id");
                                                cell1.innerHTML = "";
                                                cell2.classList.add("version-file-name");
                                                cell2.innerHTML = "<a class='lnk-version-file-name' href='#'>" + res.FileName + "</a>";
                                                cell3.classList.add("version-created-on");
                                                cell3.innerHTML = "-";
                                                cell4.classList.add("version-file-size");
                                                cell4.innerHTML = res.FileSize;
                                                cell5.classList.add("version-delete");
                                                cell5.innerHTML = "<input type='button' class='btn-delete-version btn btn-danger btn-xs' value='Delete'>";

                                                goToBottom(jBoxContent);

                                                // Download version
                                                cell2.querySelector(".lnk-version-file-name").onclick = function () {
                                                    let url = "http://" + encodeURIComponent(username) + ":" + encodeURIComponent(password) + "@" + Settings.Hostname + ":" + Settings.Port + "/wexflow/downloadFile?p=" + encodeURIComponent(res.FilePath);
                                                    window.open(url, "_self");
                                                };

                                                cell5.querySelector(".btn-delete-version").onclick = function () {
                                                    // Delete file
                                                    Common.post(uri + "/deleteTempVersionFile?p=" + encodeURIComponent(res.FilePath), function (deleteRes) {
                                                        if (deleteRes === true) {
                                                            let versionIndex = -1;
                                                            for (let j = 0; j < editedRecord.Versions.length; j++) {
                                                                if (editedRecord.Versions[j].FilePath === res.FilePath) {
                                                                    versionIndex = j;
                                                                    break;
                                                                }
                                                            }
                                                            if (versionIndex > -1) {
                                                                editedRecord.Versions.splice(versionIndex, 1);
                                                                // Update versions table
                                                                row.remove();
                                                                Common.toastSuccess("Version file deleted successfully.");
                                                            }

                                                        } else {
                                                            Common.toastError("An error occured while deleting the version file.");
                                                        }

                                                    }, function () { }, "", auth);
                                                };

                                                jBoxContent.querySelector(".spn-upload-version").innerHTML = "";
                                            }
                                            filedialog.value = "";
                                        }, function () { }, fd, auth, true);
                                    };
                                };

                                let jBoxFooter = document.getElementsByClassName("jBox-footer")[0];
                                if (userProfile === 1 && record.CreatedBy !== username) {
                                    jBoxFooter.querySelector(".record-delete").style.display = "none";
                                }

                                jBoxFooter.querySelector(".record-save").onclick = function () {
                                    editedRecord.Name = jBoxContent.querySelector(".record-name").value;
                                    editedRecord.Description = jBoxContent.querySelector(".record-description").value;
                                    editedRecord.StartDate = jBoxContent.querySelector(".record-start-date").value;
                                    editedRecord.EndDate = jBoxContent.querySelector(".record-end-date").value;
                                    editedRecord.Comments = jBoxContent.querySelector(".record-comments").value;
                                    editedRecord.ManagerComments = jBoxContent.querySelector(".record-manager-comments").value;
                                    Common.post(uri + "/saveRecord", function (res) {
                                        if (res === true) {
                                            if (username !== record.CreatedBy) {
                                                // Notify record.CreatedBy
                                                let message = "The record " + record.Name + " was updated by the user " + username + ".";
                                                Common.post(uri + "/notify?a=" + encodeURIComponent(record.CreatedBy) + "&m=" + encodeURIComponent(message), function (notifyRes) {
                                                    if (notifyRes === true) {
                                                        Common.toastInfo("The creator of the record was notified by the modification of the record.");
                                                    } else {
                                                        Common.toastError("An error occured while notifying the creator of the record.");
                                                    }
                                                }, function () { }, "", auth);
                                            }
                                            modal.close();
                                            modal.destroy();
                                            loadRecords();
                                            Common.toastSuccess("Record saved successfully.");
                                        } else {
                                            Common.toastError("An error occured while saing the record.");
                                        }
                                    }, function () { }, editedRecord, auth);
                                };

                                jBoxFooter.querySelector(".record-cancel").onclick = function () {
                                    Common.post(uri + "/deleteTempVersionFiles", function (res) {
                                        if (res === true) {
                                            Common.toastSuccess("Modifications canceled successfully.");
                                        } else {
                                            Common.toastError("An error occurred while canceling modifications.");
                                        }
                                        modal.close();
                                        modal.destroy();
                                    }, function () { }, editedRecord, auth);
                                };

                                jBoxFooter.querySelector(".record-delete").onclick = function () {
                                    let cres = confirm("Are you sure you want to delete this record?");
                                    if (cres === true) {
                                        Common.post(uri + "/deleteRecords", function (res) {
                                            if (res === true) {
                                                for (let i = 0; i < rows.length; i++) {
                                                    let row = rows[i];
                                                    let id = row.getElementsByClassName("id")[0].innerHTML;
                                                    if (recordId === id) {
                                                        recordIds = Common.removeItemOnce(recordIds, recordId);
                                                        row.remove();
                                                        modal.destroy();
                                                    }
                                                }

                                            }
                                        }, function () { }, [recordId], auth);
                                    }
                                };
                            },
                            onClose: function () {
                                Common.post(uri + "/deleteTempVersionFiles", function (res) {
                                    if (res === false) {
                                        Common.toastError("An error occurred while canceling modifications.");
                                    }
                                }, function () { }, editedRecord, auth);
                            }
                        });
                        modal.open();
                    };
                }

                document.getElementById("check-all").onchange = function () {
                    for (let i = 0; i < rows.length; i++) {
                        let row = rows[i];
                        let checkBox = row.getElementsByClassName("check")[0].firstChild;
                        let recordId = row.getElementsByClassName("id")[0].innerHTML;

                        if (checkBox.checked === true) {
                            checkBox.checked = false;
                            recordIds = Common.removeItemOnce(recordIds, recordId);
                        } else {
                            checkBox.checked = true;
                            recordIds.push(recordId);
                        }
                    }
                };

                document.getElementById("btn-delete").onclick = function () {
                    if (recordIds.length === 0) {
                        Common.toastInfo("Select records to delete.");
                    } else {
                        let cres = confirm("Are you sure you want to delete " + (recordIds.length == 1 ? "this" : "these") + " record" + (recordIds.length == 1 ? "" : "s") + "?");
                        if (cres === true) {
                            Common.post(uri + "/deleteRecords", function (res) {
                                if (res === true) {
                                    for (let i = recordIds.length - 1; i >= 0; i--) {
                                        let recordId = recordIds[i];
                                        for (let i = 0; i < rows.length; i++) {
                                            let row = rows[i];
                                            let id = row.getElementsByClassName("id")[0].innerHTML;
                                            if (recordId === id) {
                                                recordIds = Common.removeItemOnce(recordIds, recordId);
                                                row.remove();
                                            }
                                        }
                                    }
                                }
                            }, function () { }, recordIds, auth);
                        }
                    }
                };

                document.getElementById("btn-new-record").onclick = function () {
                    if (modal) {
                        modal.destroy();
                    }

                    let newRecord = {};
                    newRecord.Versions = [];

                    modal = new jBox('Modal', {
                        width: 800,
                        height: 420,
                        title: "Record information",
                        content: document.getElementById("edit-record").innerHTML,
                        footer: document.getElementById("edit-record-footer").innerHTML,
                        overlay: true,
                        isolateScroll: false,
                        delayOpen: 0,
                        onOpen: function () {
                            let jBoxContent = document.getElementsByClassName("jBox-content")[0];
                            jBoxContent.querySelector(".edit-record-tr-id").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-approved").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-created-by").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-created-on").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-modified-by").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-modified-on").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-assigned-to").style.display = "none";
                            jBoxContent.querySelector(".edit-record-tr-assigned-on").style.display = "none";
                            jBoxContent.querySelector(".edit-record-td-start-date").innerHTML += " (Optional)";
                            jBoxContent.querySelector(".edit-record-td-end-date").innerHTML += " (Optional)";

                            setTimeout(function () {
                                let recodNameTxt = jBoxContent.querySelector(".record-name");
                                recodNameTxt.focus();
                                recodNameTxt.select();
                            }, 0);

                            // Upload version
                            jBoxContent.querySelector(".btn-upload-version").onclick = function () {
                                let filedialog = document.getElementById("file-dialog");
                                filedialog.click();

                                filedialog.onchange = function (e) {
                                    jBoxContent.querySelector(".spn-upload-version").innerHTML = "Uploading...";

                                    let file = e.target.files[0];
                                    let fd = new FormData();
                                    fd.append("file", file);

                                    Common.post(uri + "/uploadVersion?r=-1", function (res) {
                                        if (res.Result === true) {
                                            newRecord.Versions.push({
                                                RecordId: "-1",
                                                FilePath: res.FilePath,
                                                FileName: res.FileName,
                                                CreatedOn: ""
                                            });

                                            // Add row in .record-versions
                                            let versionsTable = jBoxContent.querySelector(".record-versions");
                                            let row = versionsTable.insertRow(-1);
                                            let cell1 = row.insertCell(0);
                                            let cell2 = row.insertCell(1);
                                            let cell3 = row.insertCell(2);
                                            let cell4 = row.insertCell(3);

                                            cell1.classList.add("version-id");
                                            cell1.innerHTML = "";
                                            cell2.classList.add("version-file-name");
                                            cell2.innerHTML = "<a class='lnk-version-file-name' href='#'>" + res.FileName + "</a>";
                                            cell3.classList.add("version-created-on");
                                            cell3.innerHTML = "-";
                                            cell4.classList.add("version-delete");
                                            cell4.innerHTML = "<input type='button' class='btn-delete-version btn btn-danger btn-xs' value='Delete'>";

                                            goToBottom(jBoxContent);

                                            cell2.querySelector(".lnk-version-file-name").onclick = function () {
                                                let url = "http://" + encodeURIComponent(username) + ":" + encodeURIComponent(password) + "@" + Settings.Hostname + ":" + Settings.Port + "/wexflow/downloadFile?p=" + encodeURIComponent(res.FilePath);
                                                window.open(url, "_self");
                                            };

                                            cell4.querySelector(".btn-delete-version").onclick = function () {
                                                // Delete file
                                                Common.post(uri + "/deleteTempVersionFile?p=" + encodeURIComponent(res.FilePath), function (deleteRes) {
                                                    if (deleteRes === true) {
                                                        let versionIndex = -1;
                                                        for (let j = 0; j < newRecord.Versions.length; j++) {
                                                            if (newRecord.Versions[j].FilePath === res.FilePath) {
                                                                versionIndex = j;
                                                                break;
                                                            }
                                                        }
                                                        if (versionIndex > -1) {
                                                            newRecord.Versions.splice(versionIndex, 1);
                                                            // Update versions table
                                                            row.remove();
                                                            Common.toastSuccess("Version file deleted successfully.");
                                                        }

                                                    } else {
                                                        Common.toastError("An error occured while deleting the version file.");
                                                    }

                                                }, function () { }, "", auth);
                                            };

                                            jBoxContent.querySelector(".spn-upload-version").innerHTML = "";
                                        }
                                        filedialog.value = "";
                                    }, function () { }, fd, auth, true);
                                };
                            };

                            let jBoxFooter = document.getElementsByClassName("jBox-footer")[0];
                            jBoxFooter.querySelector(".record-delete").style.display = "none";

                            jBoxFooter.querySelector(".record-save").onclick = function () {

                                if (jBoxContent.querySelector(".record-name").value === "") {
                                    Common.toastInfo("Enter a name for this record.");
                                    return;
                                }

                                newRecord.Id = "-1";
                                newRecord.Name = jBoxContent.querySelector(".record-name").value;
                                newRecord.Description = jBoxContent.querySelector(".record-description").value;
                                newRecord.StartDate = jBoxContent.querySelector(".record-start-date").value;
                                newRecord.EndDate = jBoxContent.querySelector(".record-end-date").value;
                                newRecord.Comments = jBoxContent.querySelector(".record-comments").value;
                                newRecord.Approved = false;
                                newRecord.ManagerComments = jBoxContent.querySelector(".record-manager-comments").value;
                                newRecord.ModifiedBy = "";
                                newRecord.ModifiedOn = "";
                                newRecord.CreatedBy = username;
                                newRecord.CreatedOn = "";
                                newRecord.AssignedTo = "";
                                newRecord.AssignedOn = "";
                                Common.post(uri + "/saveRecord", function (res) {
                                    if (res === true) {
                                        modal.close();
                                        modal.destroy();
                                        loadRecords();
                                        Common.toastSuccess("Record saved successfully.");
                                    } else {
                                        Common.toastError("An error occured while saing the record.");
                                    }
                                }, function () { }, newRecord, auth);
                            };

                            jBoxFooter.querySelector(".record-cancel").onclick = function () {
                                Common.post(uri + "/deleteTempVersionFiles", function (res) {
                                    if (res === true) {
                                        Common.toastSuccess("Modifications canceled successfully.");
                                    } else {
                                        Common.toastError("An error occurred while canceling modifications.");
                                    }
                                    modal.close();
                                    modal.destroy();
                                }, function () { }, newRecord, auth);
                            };

                            jBoxFooter.querySelector(".record-delete").style.display = "none";
                        },
                        onClose: function () {
                            Common.post(uri + "/deleteTempVersionFiles", function (res) {
                                if (res === false) {
                                    Common.toastError("An error occurred while canceling modifications.");
                                }
                            }, function () { }, newRecord, auth);
                        }
                    });
                    modal.open();

                };

            };

            // Load records
            if (userProfile === 0) {
                Common.get(uri + "/searchRecords?s=" + encodeURIComponent(searchText.value), function (records) {
                    loadRecordsTable(records);
                }, function () { }, auth);
            } else if (userProfile === 1) {
                Common.get(uri + "/searchRecordsCreatedByOrAssignedTo?s=" + encodeURIComponent(searchText.value) + "&c=" + encodeURIComponent(username) + "&a=" + encodeURIComponent(username), function (records) {
                    loadRecordsTable(records);
                }, function () { }, auth);
            }

            function goToBottom(element) {
                element.scrollTop = element.scrollHeight - element.clientHeight;
            }
        }
    }

};