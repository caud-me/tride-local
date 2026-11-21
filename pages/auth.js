/* oobe setup, first-time welcome tutorial, and login screens */

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

function buildOobeIntroNodes(iconGlyph, titleText, descText) {
    const wrap = trEl("div", "vbox center gap-s");
    if (iconGlyph) {
        const icon = trIcon(iconGlyph, { size: "big" });
        wrap.appendChild(icon);
    }
    const titleEl = trEl("p", "hero-title", titleText);
    wrap.appendChild(titleEl);
    if (descText) {
        const descEl = trEl("p", "as-small as-gray text-center", descText);
        wrap.appendChild(descEl);
    }
    return wrap;
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

    const errorEl = trEl("p", "as-small critical text-center hidden", "");

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

    const main = trEl("main", "content vbox justify-center gap-l flex1");
    const items = [];

    if (step === 1) {
        const welcomeWrap = trEl("div", "vbox center gap-s");
        const logo = trBrandLogo("TRIDE");
        const heroTitle = trEl("p", "hero-title", "Madali na lang\nyan sa tride.");
        heroTitle.style.whiteSpace = "pre-line";
        const desc = trEl("small", "as-gray text-center", "Set up your tricycle federation in a few quick steps.");
        trAppend(welcomeWrap, [logo, heroTitle, desc]);
        main.appendChild(welcomeWrap);

        const startBtn = trButton({
            label: "Get started",
            variant: "primary",
            onClick: function () {
                pushPage(renderOobeStep, { step: 2, draft: draft });
            }
        });
        items.push(startBtn);

        if (typeof apiSeedSampleData === "function") {
            const seedLink = trEl("p", "as-small as-gray text-center clickable", "...or you can try demo mode");
            trBindTap(seedLink, async function () {
                try {
                    await apiSeedSampleData();
                    presentSuccessScreen({
                        badge: "SAMPLE",
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
            items.push(seedLink);
        }
    } else if (step === 2) {
        const intro = buildOobeIntroNodes("\uE8F1", "Get to know Tride", "Manage TODAs, tricycle units, and member records in one place.");
        trAppend(main, intro);

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
        items.push(infoCard, nextBtn);
    } else if (step === 3) {
        const intro = buildOobeIntroNodes("\uE707", "Built for Naga City", "Designed around local TODAs and the Naga City Tricycle Federation.");
        trAppend(main, intro);

        const r1 = trListItem({ title: "Federation-first", subtitle: "Structured around the Naga City Tricycle Federation." });
        const r2 = trListItem({ title: "Role-based access", subtitle: "Separate views for Secretary, President, and Members." });
        // const r3 = trListItem({ title: "Works offline", subtitle: "Designed to stay fast and usable even on mobile data." });
        const infoCard = trListCard([r1, r2]);

        const nextBtn = trButton({
            label: "Next",
            variant: "primary",
            onClick: function () {
                pushPage(renderOobeStep, { step: 4, draft: draft });
            }
        });
        items.push(infoCard, nextBtn);
    } else if (step === 4) {
        const intro = buildOobeIntroNodes(null, "Federation setup", "Enter your federation ID and official name.");
        trAppend(main, intro);

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
        items.push(fedCard, nextBtn);
    } else if (step === 5) {
        const intro = buildOobeIntroNodes(null, "Who is the secretary?", "Enter your secretary ID and full name.");
        trAppend(main, intro);

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
        items.push(secCard, nextBtn);
    } else if (step === 6) {
        const intro = buildOobeIntroNodes(null, "What's your address?", "Enter your current residential address.");
        trAppend(main, intro);

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
        items.push(addrCard, nextBtn);
    } else if (step === 7) {
        const intro = buildOobeIntroNodes(null, "Enter your contact number", "We use this for federation notices.");
        trAppend(main, intro);

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
        items.push(contactCard, nextBtn);
    } else if (step === 8) {
        const intro = buildOobeIntroNodes(null, "Are you a driver?", "Let us know if you also operate a tricycle unit.");
        trAppend(main, intro);

        const errorEl = trEl("p", "as-small critical text-center hidden", "");
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
        items.push(driverCard, errorEl, nextBtn);
    } else if (step === 9) {
        const intro = buildOobeIntroNodes(null, "Enter your license no.", "Provide your driver's license number.");
        trAppend(main, intro);

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
        items.push(licenseCard, nextBtn);
    }

    trAppend(main, items);
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
    const main = trEl("main", "content vbox justify-center gap-m");
    const isAdminPortal = window.location.pathname.indexOf("admin") !== -1;
    const heroHeading = isAdminPortal ? "Ready for takeoff." : "Madali na lang yan\nsa tride.";

    const hero = trHero({
        logoText: "TRIDE",
        title: heroHeading
    });

    const idRow = trPropertyRow({
        label: "ID",
        input: { placeholder: "Enter your ID" }
    });
    const loginCard = trCard([idRow]);

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

    const footerCaption = trEl("small", "text-center as-gray", footerNote);
    const footerBtn = trButton({
        label: footerBtnLabel,
        onClick: function () {
            window.location.href = footerTarget;
        }
    });
    const footer = trEl("footer", "vbox gap-s");
    trAppend(footer, [footerCaption, footerBtn]);

    trAppend(main, [hero, loginCard, loginBtn, footer]);
    return [main];
}
