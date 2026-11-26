/* oobe setup, first-time welcome tutorial, and login screens */

const TRIDE_AUTH_BRAND_SVG = '<svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.40071e-06 4.86V3.792L1.392 3.228L2.448 1.2H3.84V3.048H6.72V4.86H3.84V6.876C3.84 7.372 3.94 7.72 4.14 7.92C4.34 8.12 4.704 8.22 5.232 8.22C5.568 8.22 5.864 8.192 6.12 8.136C6.384 8.072 6.624 7.992 6.84 7.896V9.744C6.6 9.832 6.284 9.912 5.892 9.984C5.5 10.056 5.096 10.092 4.68 10.092C3.92 10.092 3.296 9.976 2.808 9.744C2.328 9.512 1.972 9.18 1.74 8.748C1.508 8.308 1.392 7.796 1.392 7.212V4.86H1.40071e-06ZM7.02647 3.048H9.52247L9.93047 5.496V9.9H7.48247V5.352L7.02647 3.048ZM13.1465 2.94V5.028C12.9065 4.98 12.6785 4.948 12.4625 4.932C12.2545 4.908 12.0625 4.896 11.8865 4.896C11.5345 4.896 11.2105 4.968 10.9145 5.112C10.6185 5.248 10.3785 5.476 10.1945 5.796C10.0185 6.116 9.93047 6.544 9.93047 7.08L9.46247 6.504C9.52647 6.008 9.62247 5.544 9.75047 5.112C9.87847 4.672 10.0505 4.284 10.2665 3.948C10.4905 3.604 10.7665 3.336 11.0945 3.144C11.4225 2.944 11.8225 2.844 12.2945 2.844C12.4305 2.844 12.5705 2.852 12.7145 2.868C12.8585 2.884 13.0025 2.908 13.1465 2.94ZM13.5033 2.94L14.7393 3.18L15.9633 2.94V9.9H13.5033V2.94ZM14.7273 2.376C14.3033 2.376 13.9593 2.272 13.6953 2.064C13.4313 1.848 13.2993 1.556 13.2993 1.188C13.2993 0.828001 13.4313 0.540001 13.6953 0.324001C13.9593 0.108001 14.3033 9.53674e-07 14.7273 9.53674e-07C15.1673 9.53674e-07 15.5153 0.108001 15.7713 0.324001C16.0353 0.540001 16.1673 0.828001 16.1673 1.188C16.1673 1.556 16.0353 1.848 15.7713 2.064C15.5153 2.272 15.1673 2.376 14.7273 2.376ZM23.0719 9.9L22.7479 7.332L23.1679 6.492L22.7599 5.436L23.3359 0.660001H25.8799L25.1719 6.288L25.6039 9.9H23.0719ZM23.5999 6.48C23.4879 7.2 23.2639 7.832 22.9279 8.376C22.5999 8.92 22.1799 9.344 21.6679 9.648C21.1639 9.944 20.5879 10.092 19.9399 10.092C19.2679 10.092 18.6759 9.944 18.1639 9.648C17.6599 9.344 17.2639 8.92 16.9759 8.376C16.6879 7.824 16.5439 7.192 16.5439 6.48C16.5439 5.752 16.6879 5.116 16.9759 4.572C17.2639 4.028 17.6599 3.604 18.1639 3.3C18.6759 2.996 19.2679 2.844 19.9399 2.844C20.5879 2.844 21.1639 2.996 21.6679 3.3C22.1799 3.596 22.6039 4.016 22.9399 4.56C23.2759 5.096 23.4959 5.736 23.5999 6.48ZM19.0279 6.48C19.0279 6.816 19.0959 7.116 19.2319 7.38C19.3759 7.644 19.5719 7.852 19.8199 8.004C20.0679 8.148 20.3519 8.22 20.6719 8.22C21.0079 8.22 21.3239 8.148 21.6199 8.004C21.9159 7.852 22.1759 7.644 22.3999 7.38C22.6239 7.116 22.7919 6.816 22.9039 6.48C22.7919 6.136 22.6239 5.832 22.3999 5.568C22.1759 5.304 21.9159 5.096 21.6199 4.944C21.3239 4.792 21.0079 4.716 20.6719 4.716C20.3519 4.716 20.0679 4.792 19.8199 4.944C19.5719 5.096 19.3759 5.304 19.2319 5.568C19.0959 5.832 19.0279 6.136 19.0279 6.48ZM30.2625 10.092C29.4305 10.092 28.6865 9.94 28.0305 9.636C27.3825 9.332 26.8705 8.908 26.4945 8.364C26.1185 7.812 25.9305 7.172 25.9305 6.444C25.9305 5.732 26.1105 5.108 26.4705 4.572C26.8305 4.028 27.3225 3.604 27.9465 3.3C28.5785 2.996 29.2905 2.844 30.0825 2.844C30.9065 2.844 31.6065 3.024 32.1825 3.384C32.7665 3.736 33.2145 4.236 33.5265 4.884C33.8465 5.532 34.0065 6.296 34.0065 7.176H27.9105V5.7H32.6265L31.8225 6.216C31.7905 5.864 31.7025 5.568 31.5585 5.328C31.4145 5.08 31.2225 4.892 30.9825 4.764C30.7505 4.636 30.4705 4.572 30.1425 4.572C29.7825 4.572 29.4745 4.644 29.2185 4.788C28.9625 4.932 28.7625 5.132 28.6185 5.388C28.4745 5.636 28.4025 5.928 28.4025 6.264C28.4025 6.696 28.4985 7.064 28.6905 7.368C28.8905 7.664 29.1785 7.892 29.5545 8.052C29.9385 8.212 30.4065 8.292 30.9585 8.292C31.4625 8.292 31.9625 8.228 32.4585 8.1C32.9625 7.964 33.4185 7.776 33.8265 7.536V9.096C33.3545 9.416 32.8145 9.664 32.2065 9.84C31.6065 10.008 30.9585 10.092 30.2625 10.092Z" fill="white"/></svg>';

function createOobeDraft() {
    return {
        Federation_ID: "",
        Federation_Name: "",
        Member_ID: "",
        First_Name: "",
        Last_Name: "",
        Address: "",
        Contact_Number: "",
        isDriver: null,
        License_Number: ""
    };
}

function appendOobeIntroSections(main, iconGlyph, titleText, descText) {
    if (iconGlyph) {
        const icon = trIcon(iconGlyph, { size: "big", className: "as-centered" });
        main.appendChild(trSection(icon));
    }
    const headingWrap = trEl("div", "group vbox center space-t");
    const titleEl = trEl("p", "as-headline as-bold as-centered", titleText);
    headingWrap.appendChild(titleEl);
    if (descText) {
        const descEl = trEl("p", "as-secondary as-gray as-centered", descText);
        headingWrap.appendChild(descEl);
    }
    main.appendChild(trSection(headingWrap));
}

function openOobeConfirmSheet(draft) {
    const fullName = draft.First_Name + " " + draft.Last_Name;
    const licenseDisplay = draft.isDriver ? draft.License_Number : "Not a driver";

    const rFed = trPropertyRow({ label: "Federation", value: draft.Federation_Name });
    const rFedId = trPropertyRow({ label: "Federation ID", value: draft.Federation_ID });
    const rSecId = trPropertyRow({ label: "Secretary ID", value: draft.Member_ID });
    const rName = trPropertyRow({ label: "Name", value: fullName });
    const rAddr = trPropertyRow({ label: "Address", value: draft.Address });
    const rContact = trPropertyRow({ label: "Contact", value: draft.Contact_Number });
    const rLicense = trPropertyRow({ label: "License No.", value: licenseDisplay });

    const errorEl = trEl("p", "as-secondary as-critical as-centered hidden", "");

    let sheetCtrl = null;

    async function handleConfirmSubmit() {
        errorEl.classList.add("hidden");
        errorEl.textContent = "";

        const payload = {
            Federation_ID: draft.Federation_ID,
            Federation_Name: draft.Federation_Name,
            Member_ID: draft.Member_ID,
            First_Name: draft.First_Name,
            Last_Name: draft.Last_Name,
            Address: draft.Address,
            Contact_Number: draft.Contact_Number,
            License_Number: draft.isDriver ? draft.License_Number : ""
        };

        try {
            await apiCompleteOobe(payload);
            setSessionMemberId(payload.Member_ID);
            sheetCtrl.close();

            const previewCard = trProfileCard({
                firstName: payload.First_Name,
                lastName: payload.Last_Name,
                address: payload.Address,
                contact: payload.Contact_Number,
                todaName: "Federation Office",
                license: payload.License_Number || "No license"
            });

            presentSuccessScreen({
                badge: "SETUP",
                title: "Setup complete",
                subtitle: payload.Federation_Name + " is ready.",
                card: previewCard,
                buttonLabel: "Open Dashboard",
                palette: "metal",
                onDone: function () {
                    setRootPage(renderHomePage, { activeRole: "secretary" });
                }
            });
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove("hidden");
        }
    }

    const confirmBtn = trButton({
        label: "Create account",
        variant: "primary",
        onClick: handleConfirmSubmit
    });

    sheetCtrl = trSheet({
        title: "Confirm secretary account",
        description: "Review your details before creating the federation.",
        body: [rFed, rFedId, rSecId, rName, rAddr, rContact, rLicense, errorEl],
        footer: [confirmBtn],
        removeOnClose: true
    });
    sheetCtrl.open();
}

function renderOobeStep(params) {
    const safeParams = params || {};
    const step = safeParams.step || 1;
    const draft = safeParams.draft || createOobeDraft();
    const totalSteps = draft.isDriver === true ? 9 : 8;

    const output = [];
    const progressBar = trStoryBar({ total: totalSteps, current: step });
    output.push(progressBar);

    if (step > 1) {
        const navBar = trNavBar({ onBack: popPage });
        output.push(navBar);
    }

    const main = trEl("main", "content vbox justify-center space-xl flex1");
    const contentItems = [];
    const buttonItems = [];

    if (step === 1) {
        const welcomeWrap = trEl("div", "group vbox center space-t");
        const logo = trBrandLogo({ svg: TRIDE_AUTH_BRAND_SVG });
        const titleEl = trEl("p", "as-title as-bold as-centered");
        titleEl.appendChild(document.createTextNode("Madali na lang"));
        titleEl.appendChild(document.createElement("br"));
        titleEl.appendChild(document.createTextNode("yan sa tride."));
        const desc = trEl("p", "as-secondary as-gray as-centered", "Set up your tricycle federation in a few quick steps.");
        trAppend(welcomeWrap, [logo, titleEl, desc]);
        main.appendChild(trSection(welcomeWrap));

        const startBtn = trButton({
            label: "Get started",
            variant: "primary",
            onClick: function () {
                pushPage(renderOobeStep, { step: 2, draft: draft });
            }
        });
        const step1Actions = trEl("div", "group vbox space-l");
        step1Actions.appendChild(startBtn);

        if (typeof apiSeedSampleData === "function") {
            const seedLink = trEl("p", "as-tertiary as-gray as-centered", "...or you can try demo mode");
            trBindTap(seedLink, async function () {
                try {
                    await apiSeedSampleData();
                    presentSuccessScreen({
                        title: "Sample data loaded",
                        subtitle: "Sign in with ID 1 for Secretary, 2 for President, or 3-96 for Members.",
                        buttonLabel: "Go to Login",
                        palette: "metal",
                        onDone: function () {
                            setRootPage(renderLoginPage, {});
                        }
                    });
                } catch (err) {
                    trAlert({ title: "Error", message: err.message });
                }
            });
            step1Actions.appendChild(seedLink);
        }
        main.appendChild(trSection(step1Actions));
    } else if (step === 2) {
        appendOobeIntroSections(main, "\uE8F1", "Get to know Tride", "Manage TODAs, tricycle units, and member records in one place.");

        const r1 = trListItem({ title: "TODAs & associations", subtitle: "Organize local tricycle associations and their officers." });
        const r2 = trListItem({ title: "Tricycle units", subtitle: "Track plate numbers, body numbers, and unit assignments." });
        const r3 = trListItem({ title: "Member records", subtitle: "Keep driver, operator, and secretary profiles up to date." });
        const infoCard = trListCard([r1, r2, r3]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                pushPage(renderOobeStep, { step: 3, draft: draft });
            }
        });
        contentItems.push(infoCard);
        buttonItems.push(nextBtn);
    } else if (step === 3) {
        appendOobeIntroSections(main, "\uE707", "Built for Naga City", "Designed around local TODAs and the Naga City Tricycle Federation.");

        const r1 = trListItem({ title: "Federation-first", subtitle: "Structured around the Naga City Tricycle Federation." });
        const r2 = trListItem({ title: "Role-based access", subtitle: "Separate views for Secretary, President, and Members." });
        const r3 = trListItem({ title: "Works offline", subtitle: "Designed to stay fast and usable even on mobile data." });
        const infoCard = trListCard([r1, r2, r3]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                pushPage(renderOobeStep, { step: 4, draft: draft });
            }
        });
        contentItems.push(infoCard);
        buttonItems.push(nextBtn);
    } else if (step === 4) {
        appendOobeIntroSections(main, null, "Federation setup", "Enter your federation ID and official name.");

        const fedIdRow = trPropertyRow({
            label: "Federation ID",
            input: { value: draft.Federation_ID, placeholder: "e.g. FED-01" }
        });
        const fedNameRow = trPropertyRow({
            label: "Federation Name",
            input: { value: draft.Federation_Name, placeholder: "Federation name" }
        });
        const fedCard = trListCard([fedIdRow, fedNameRow]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                const rawFedId = fedIdRow.controlEl.value;
                const fedId = rawFedId.trim();
                const rawFedName = fedNameRow.controlEl.value;
                const fedName = rawFedName.trim();

                fedIdRow.setError(fedId ? "" : "Required");
                fedNameRow.setError(fedName ? "" : "Required");
                if (!fedId || !fedName) {
                    return;
                }

                draft.Federation_ID = fedId;
                draft.Federation_Name = fedName;
                pushPage(renderOobeStep, { step: 5, draft: draft });
            }
        });
        contentItems.push(fedCard);
        buttonItems.push(nextBtn);
    } else if (step === 5) {
        appendOobeIntroSections(main, null, "Who is the secretary?", "Enter your secretary ID and full name.");

        const secIdRow = trPropertyRow({
            label: "Secretary Member ID",
            input: { value: draft.Member_ID, placeholder: "e.g. SEC-001" }
        });
        const firstRow = trPropertyRow({
            label: "First Name",
            input: { value: draft.First_Name, placeholder: "First name" }
        });
        const lastRow = trPropertyRow({
            label: "Last Name",
            input: { value: draft.Last_Name, placeholder: "Last name" }
        });
        const secCard = trListCard([secIdRow, firstRow, lastRow]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                const rawSecId = secIdRow.controlEl.value;
                const secId = rawSecId.trim();
                const rawFirst = firstRow.controlEl.value;
                const firstName = rawFirst.trim();
                const rawLast = lastRow.controlEl.value;
                const lastName = rawLast.trim();

                secIdRow.setError(secId ? "" : "Required");
                firstRow.setError(firstName ? "" : "Required");
                lastRow.setError(lastName ? "" : "Required");
                if (!secId || !firstName || !lastName) {
                    return;
                }

                draft.Member_ID = secId;
                draft.First_Name = firstName;
                draft.Last_Name = lastName;
                pushPage(renderOobeStep, { step: 6, draft: draft });
            }
        });
        contentItems.push(secCard);
        buttonItems.push(nextBtn);
    } else if (step === 6) {
        appendOobeIntroSections(main, null, "What's your address?", "Enter your current residential address.");

        const addrRow = trPropertyRow({
            label: "Address",
            input: { value: draft.Address, placeholder: "Address" }
        });
        const addrCard = trListCard([addrRow]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                const rawAddr = addrRow.controlEl.value;
                const address = rawAddr.trim();

                addrRow.setError(address ? "" : "Required");
                if (!address) {
                    return;
                }

                draft.Address = address;
                pushPage(renderOobeStep, { step: 7, draft: draft });
            }
        });
        contentItems.push(addrCard);
        buttonItems.push(nextBtn);
    } else if (step === 7) {
        appendOobeIntroSections(main, null, "Enter your contact number", "We use this for federation notices.");

        const contactRow = trPropertyRow({
            label: "Contact Number",
            input: { value: draft.Contact_Number, placeholder: "09XXXXXXXXX" }
        });
        const contactCard = trListCard([contactRow]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                const rawContact = contactRow.controlEl.value;
                const contact = rawContact.trim();

                contactRow.setError(contact ? "" : "Required");
                if (!contact) {
                    return;
                }

                draft.Contact_Number = contact;
                pushPage(renderOobeStep, { step: 8, draft: draft });
            }
        });
        contentItems.push(contactCard);
        buttonItems.push(nextBtn);
    } else if (step === 8) {
        appendOobeIntroSections(main, null, "Are you a driver?", "Let us know if you also operate a tricycle unit.");

        const errorEl = trEl("p", "as-secondary as-critical as-centered hidden", "");
        let yesRow = null;
        let noRow = null;

        yesRow = trCheckRow({
            title: "I am a driver",
            checked: draft.isDriver === true,
            onChange: function (checked) {
                if (checked) {
                    draft.isDriver = true;
                    const noInput = noRow.querySelector("input");
                    noInput.checked = false;
                    errorEl.classList.add("hidden");
                } else {
                    draft.isDriver = null;
                }
            }
        });

        noRow = trCheckRow({
            title: "I am not a driver",
            checked: draft.isDriver === false,
            onChange: function (checked) {
                if (checked) {
                    draft.isDriver = false;
                    const yesInput = yesRow.querySelector("input");
                    yesInput.checked = false;
                    errorEl.classList.add("hidden");
                } else {
                    draft.isDriver = null;
                }
            }
        });

        const driverCard = trListCard([yesRow, noRow]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                if (draft.isDriver === null) {
                    errorEl.textContent = "Please choose one option.";
                    errorEl.classList.remove("hidden");
                    return;
                }
                if (draft.isDriver === true) {
                    pushPage(renderOobeStep, { step: 9, draft: draft });
                    return;
                }
                draft.License_Number = "";
                openOobeConfirmSheet(draft);
            }
        });
        contentItems.push(driverCard, errorEl);
        buttonItems.push(nextBtn);
    } else if (step === 9) {
        appendOobeIntroSections(main, null, "Enter your license no.", "Provide your driver's license number.");

        const licenseRow = trPropertyRow({
            label: "License Number",
            input: { value: draft.License_Number, placeholder: "e.g. D01-23-456789" }
        });
        const licenseCard = trListCard([licenseRow]);

        const nextBtn = trButton({
            label: "Review & finish",
            variant: "primary",
            onClick: function () {
                const rawLicense = licenseRow.controlEl.value;
                const license = rawLicense.trim();

                licenseRow.setError(license ? "" : "Required");
                if (!license) {
                    return;
                }

                draft.License_Number = license;
                openOobeConfirmSheet(draft);
            }
        });
        contentItems.push(licenseCard);
        buttonItems.push(nextBtn);
    }

    if (contentItems.length > 0) {
        main.appendChild(trSection(contentItems));
    }
    if (buttonItems.length > 0) {
        main.appendChild(trSection(buttonItems));
    }
    output.push(main);
    return output;
}

function renderOobePage(params) {
    const safeParams = params || {};
    if (!safeParams.draft) {
        safeParams.draft = createOobeDraft();
    }
    return renderOobeStep({ step: 1, draft: safeParams.draft });
}

function renderLoginPage() {
    const main = trEl("main", "content vbox justify-center space-xl");
    const isAdminPortal = window.location.pathname.indexOf("/admin") !== -1;
    const heroHeading = isAdminPortal ? "Ready for takeoff." : "Madali na lang yan\nsa tride.";

    const hero = trEl("div", "group vbox center space-t");
    hero.appendChild(trBrandLogo({ svg: TRIDE_AUTH_BRAND_SVG }));
    const heroTitle = trEl("p", "as-title as-bold as-centered");
    const heroLines = heroHeading.split("\n");
    for (let i = 0; i < heroLines.length; i += 1) {
        if (i > 0) {
            heroTitle.appendChild(document.createElement("br"));
        }
        heroTitle.appendChild(document.createTextNode(heroLines[i]));
    }
    hero.appendChild(heroTitle);

    const idRow = trPropertyRow({
        label: "ID",
        input: { placeholder: "Enter your ID" }
    });
    const loginCard = trCardGroup({
        card: trCard([idRow]),
        footnote: "Use the Member ID or Secretary ID issued by your federation."
    });

    async function handleLoginSubmit() {
        const memberId = idRow.controlEl.value.trim();
        if (!memberId) {
            idRow.setError("Please enter your Member ID.");
            return;
        }

        try {
            const res = await apiLogin(memberId);
            idRow.setError("");
            setSessionMemberId(res.member.Member_ID);
            setRootPage(renderHomePage, { activeRole: null });
        } catch (err) {
            idRow.setError(err.message);
        }
    }

    const loginBtn = trButton({
        label: "Log in",
        variant: "primary",
        onClick: handleLoginSubmit
    });

    const footerNote = isAdminPortal
        ? "Driver or Operator?"
        : "TODA President or Federation Secretary?";
    const footerBtnLabel = isAdminPortal
        ? "Back to Member App"
        : "Sign in at Admin Portal";
    const footerTarget = isAdminPortal ? "index.html" : "admin.html";

    const footerCaption = trEl("p", "as-tertiary as-centered as-gray", footerNote);
    const footerBtn = trButton({
        label: footerBtnLabel,
        onClick: function () {
            window.location.href = footerTarget;
        }
    });
    const heroSection = trSection(hero);
    const formSection = trSection([loginCard, loginBtn]);

    const footerGroup = trEl("div", "group vbox space-m");
    trAppend(footerGroup, [footerCaption, footerBtn]);
    const footer = trEl("footer", "trSection section vbox space-l");
    footer.appendChild(footerGroup);

    trAppend(main, [heroSection, formSection, footer]);
    return [main];
}
