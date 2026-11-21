/* oobe setup, first-time welcome tutorial, and login screens */

function renderOobePage() {
    const main = trEl("main", "content vbox justify-center gap-m");

    const hero = trHero({
        logoText: "TRIDE",
        title: "First-time setup"
    });

    const fedIdRow = trPropertyRow({
        label: "Federation ID",
        input: { value: "FED-01", placeholder: "e.g. FED-01" }
    });
    const fedNameRow = trPropertyRow({
        label: "Federation Name",
        input: { value: "Naga City Tricycle Federation", placeholder: "Federation name" }
    });
    const fedCard = trListCard([fedIdRow, fedNameRow]);

    const secIdRow = trPropertyRow({
        label: "Secretary Member ID",
        input: { value: "SEC-001", placeholder: "e.g. SEC-001" }
    });
    const firstRow = trPropertyRow({ label: "First Name", input: { placeholder: "First name" } });
    const lastRow = trPropertyRow({ label: "Last Name", input: { placeholder: "Last name" } });
    const addrRow = trPropertyRow({ label: "Address", input: { placeholder: "Address" } });
    const contactRow = trPropertyRow({ label: "Contact Number", input: { placeholder: "09XXXXXXXXX" } });
    const licenseRow = trPropertyRow({
        label: "License Number (Optional)",
        input: { placeholder: "Leave blank if non-driver" }
    });

    const secCard = trListCard([
        secIdRow,
        firstRow,
        lastRow,
        addrRow,
        contactRow,
        licenseRow
    ]);

    async function handleCompleteOobe() {
        const fedId = fedIdRow.controlEl.value.trim();
        const fedName = fedNameRow.controlEl.value.trim();
        const secId = secIdRow.controlEl.value.trim();
        const firstName = firstRow.controlEl.value.trim();
        const lastName = lastRow.controlEl.value.trim();
        const address = addrRow.controlEl.value.trim();
        const contact = contactRow.controlEl.value.trim();
        const license = licenseRow.controlEl.value.trim();

        fedIdRow.setError(fedId ? "" : "Required");
        fedNameRow.setError(fedName ? "" : "Required");
        secIdRow.setError(secId ? "" : "Required");
        firstRow.setError(firstName ? "" : "Required");
        lastRow.setError(lastName ? "" : "Required");
        addrRow.setError(address ? "" : "Required");
        contactRow.setError(contact ? "" : "Required");

        const missingRequired = !fedId || !fedName || !secId || !firstName || !lastName || !address || !contact;
        if (missingRequired) {
            return;
        }

        const payload = {
            Federation_ID: fedId,
            Federation_Name: fedName,
            Member_ID: secId,
            First_Name: firstName,
            Last_Name: lastName,
            Address: address,
            Contact_Number: contact,
            License_Number: license
        };

        try {
            await apiCompleteOobe(payload);
            setSessionMemberId(payload.Member_ID);
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
                palette: "green",
                onDone: function () {
                    setRootPage(renderHomePage, { activeRole: "secretary" });
                }
            });
        } catch (err) {
            secIdRow.setError(err.message);
        }
    }

    const submitBtn = trButton({
        label: "Complete setup",
        variant: "primary",
        onClick: handleCompleteOobe
    });

    const items = [hero, fedCard, secCard, submitBtn];
    if (typeof apiSeedSampleData === "function") {
        const seedHint = trEl("small", "text-center as-gray", "Or load sample placeholder records into localStorage.");
        const seedBtn = trButton({
            label: "Load placeholder data (96 members)",
            onClick: async function () {
                try {
                    await apiSeedSampleData();
                    presentSuccessScreen({
                        badge: "SAMPLE",
                        title: "Sample data loaded",
                        subtitle: "Sign in with ID 1 for Secretary, 2 for President, or 3-96 for Members.",
                        buttonLabel: "Go to Login",
                        onDone: function () {
                            setRootPage(renderLoginPage, {});
                        }
                    });
                } catch (err) {
                    trAlert({ title: "Error", message: err.message });
                }
            }
        });
        items.push(seedHint, seedBtn);
    }

    trAppend(main, items);
    return [main];
}

function renderLoginPage() {
    const main = trEl("main", "content vbox justify-center gap-m");
    const isAdminPortal = window.location.pathname.indexOf("admin") !== -1;
    const heroHeading = isAdminPortal ? "Ready for takeoff." : "Madali na lang yan\nsa tride.";

    const hero = trHero({
        logoText: "TRIDE",
        title: heroHeading
    });
    const heroTitle = hero.querySelector(".hero-title");
    heroTitle.style.whiteSpace = "pre-line";

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
