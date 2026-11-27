/* offline dbms1_tride schema metadata and official sample seed dataset */

const LOCAL_ID_MAX_LENGTH = 10;
const LOCAL_BODY_NUMBER_MAX_LENGTH = 15;
const LOCAL_PLATE_MAX_LENGTH = 15;
const LOCAL_CONTACT_MAX_LENGTH = 15;
const LOCAL_LICENSE_MAX_LENGTH = 25;
const LOCAL_FRANCHISE_MAX_LENGTH = 25;
const LOCAL_PSO_BLS_MAX_LENGTH = 25;
const LOCAL_CHASSIS_MAX_LENGTH = 30;
const LOCAL_ACCREDITATION_MAX_LENGTH = 30;
const LOCAL_SEC_REG_MAX_LENGTH = 30;
const LOCAL_SHIFT_MAX_LENGTH = 50;
const LOCAL_MAX_OWNED_TRICYCLES = 5;

const LOCAL_DEFAULT_CITY = "Naga City";
const LOCAL_DEFAULT_TODA_STATUS = "Active";
const LOCAL_DEFAULT_FRANCHISE_STATUS = "Active";
const LOCAL_DEFAULT_ASSIGNMENT_STATUS = "Active";

const LOCAL_TODA_STATUS_VALUES = ["Active", "Expired", "Suspended"];
const LOCAL_LICENSE_TYPE_VALUES = ["Professional", "Non-Professional"];
const LOCAL_FRANCHISE_STATUS_VALUES = ["Active", "Expired", "Revoked"];
const LOCAL_COLOR_ZONE_VALUES = ["Red", "Blue", "Green", "Yellow", "STF-Blue", "STF-White", "White"];
const LOCAL_DRIVER_ROLE_VALUES = ["Primary", "Alternate"];
const LOCAL_ASSIGNMENT_STATUS_VALUES = ["Active", "Inactive"];
const LOCAL_OFFICER_POSITION_VALUES = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Auditor",
    "Sgt. at Arms",
    "Board of Directors"
];
const LOCAL_TODA_WRITE_POSITIONS = ["President", "Vice President", "Secretary"];

// based on final_dbms1_relational-model.md, data dictionary, mirror six table column layouts from live mysql metadata
const TRIDE_LOCAL_SCHEMA = {
    federation: {
        tableName: "federation",
        primaryKey: "Federation_ID",
        columnNames: [
            "Federation_ID",
            "Federation_Name",
            "Accreditation_Number",
            "Accreditation_Expiry",
            "Office_Address",
            "Secretary_Member_ID"
        ],
        columns: [
            { name: "Federation_ID", position: 1, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: true, maxLength: 10 },
            { name: "Federation_Name", position: 2, nullable: false, dataType: "varchar", columnType: "varchar(100)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 100 },
            { name: "Accreditation_Number", position: 3, nullable: false, dataType: "varchar", columnType: "varchar(30)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 30 },
            { name: "Accreditation_Expiry", position: 4, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Office_Address", position: 5, nullable: false, dataType: "varchar", columnType: "varchar(150)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 150 },
            { name: "Secretary_Member_ID", position: 6, nullable: true, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 }
        ]
    },
    toda_association: {
        tableName: "toda_association",
        primaryKey: "TODA_ID",
        columnNames: [
            "TODA_ID",
            "TODA_Name",
            "Route",
            "SEC_Reg_Number",
            "Terminal_Location",
            "Accreditation_Expiry",
            "Association_Status",
            "Federation_ID"
        ],
        columns: [
            { name: "TODA_ID", position: 1, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: true, maxLength: 10 },
            { name: "TODA_Name", position: 2, nullable: false, dataType: "varchar", columnType: "varchar(100)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 100 },
            { name: "Route", position: 3, nullable: false, dataType: "varchar", columnType: "varchar(120)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 120 },
            { name: "SEC_Reg_Number", position: 4, nullable: false, dataType: "varchar", columnType: "varchar(30)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 30 },
            { name: "Terminal_Location", position: 5, nullable: false, dataType: "varchar", columnType: "varchar(120)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 120 },
            { name: "Accreditation_Expiry", position: 6, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Association_Status", position: 7, nullable: false, dataType: "enum", columnType: "enum('Active','Expired','Suspended')", columnDefault: "Active", enumValues: ["Active", "Expired", "Suspended"], isPrimary: false, maxLength: 9 },
            { name: "Federation_ID", position: 8, nullable: true, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 }
        ]
    },
    member: {
        tableName: "member",
        primaryKey: "Member_ID",
        columnNames: [
            "Member_ID",
            "First_Name",
            "Last_Name",
            "Street",
            "Barangay",
            "City_Municipality",
            "Contact_Number",
            "License_Number",
            "License_Expiry_Date",
            "License_Type",
            "Restriction_Code",
            "PSO_ID_Number",
            "BLS_Cert_ID",
            "TODA_ID"
        ],
        columns: [
            { name: "Member_ID", position: 1, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: true, maxLength: 10 },
            { name: "First_Name", position: 2, nullable: false, dataType: "varchar", columnType: "varchar(50)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 50 },
            { name: "Last_Name", position: 3, nullable: false, dataType: "varchar", columnType: "varchar(50)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 50 },
            { name: "Street", position: 4, nullable: false, dataType: "varchar", columnType: "varchar(100)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 100 },
            { name: "Barangay", position: 5, nullable: false, dataType: "varchar", columnType: "varchar(60)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 60 },
            { name: "City_Municipality", position: 6, nullable: false, dataType: "varchar", columnType: "varchar(60)", columnDefault: "Naga City", enumValues: null, isPrimary: false, maxLength: 60 },
            { name: "Contact_Number", position: 7, nullable: false, dataType: "varchar", columnType: "varchar(15)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 15 },
            { name: "License_Number", position: 8, nullable: true, dataType: "varchar", columnType: "varchar(25)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 25 },
            { name: "License_Expiry_Date", position: 9, nullable: true, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "License_Type", position: 10, nullable: true, dataType: "enum", columnType: "enum('Professional','Non-Professional')", columnDefault: null, enumValues: ["Professional", "Non-Professional"], isPrimary: false, maxLength: 16 },
            { name: "Restriction_Code", position: 11, nullable: true, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 },
            { name: "PSO_ID_Number", position: 12, nullable: true, dataType: "varchar", columnType: "varchar(25)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 25 },
            { name: "BLS_Cert_ID", position: 13, nullable: true, dataType: "varchar", columnType: "varchar(25)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 25 },
            { name: "TODA_ID", position: 14, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 }
        ]
    },
    tricycle: {
        tableName: "tricycle",
        primaryKey: "Tricycle_ID",
        columnNames: [
            "Tricycle_ID",
            "Body_Number",
            "Franchise_Number",
            "Chassis_Number",
            "Plate_Number",
            "Franchise_Expiry_Date",
            "Mayors_Permit_Expiry",
            "Franchise_Status",
            "OR_CR_Expiry",
            "Color_Zone",
            "Owner_Member_ID"
        ],
        columns: [
            { name: "Tricycle_ID", position: 1, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: true, maxLength: 10 },
            { name: "Body_Number", position: 2, nullable: false, dataType: "varchar", columnType: "varchar(15)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 15 },
            { name: "Franchise_Number", position: 3, nullable: false, dataType: "varchar", columnType: "varchar(25)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 25 },
            { name: "Chassis_Number", position: 4, nullable: false, dataType: "varchar", columnType: "varchar(30)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 30 },
            { name: "Plate_Number", position: 5, nullable: false, dataType: "varchar", columnType: "varchar(15)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 15 },
            { name: "Franchise_Expiry_Date", position: 6, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Mayors_Permit_Expiry", position: 7, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Franchise_Status", position: 8, nullable: false, dataType: "enum", columnType: "enum('Active','Expired','Revoked')", columnDefault: "Active", enumValues: ["Active", "Expired", "Revoked"], isPrimary: false, maxLength: 7 },
            { name: "OR_CR_Expiry", position: 9, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Color_Zone", position: 10, nullable: true, dataType: "enum", columnType: "enum('Red','Blue','Green','Yellow','STF-Blue','STF-White','White')", columnDefault: null, enumValues: ["Red", "Blue", "Green", "Yellow", "STF-Blue", "STF-White", "White"], isPrimary: false, maxLength: 9 },
            { name: "Owner_Member_ID", position: 11, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 }
        ]
    },
    driver_assignment: {
        tableName: "driver_assignment",
        primaryKey: "Assignment_ID",
        columnNames: [
            "Assignment_ID",
            "Member_ID",
            "Tricycle_ID",
            "Driver_Role",
            "Shift_Schedule",
            "Date_Assigned",
            "Status"
        ],
        columns: [
            { name: "Assignment_ID", position: 1, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: true, maxLength: 10 },
            { name: "Member_ID", position: 2, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 },
            { name: "Tricycle_ID", position: 3, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 },
            { name: "Driver_Role", position: 4, nullable: false, dataType: "enum", columnType: "enum('Primary','Alternate')", columnDefault: null, enumValues: ["Primary", "Alternate"], isPrimary: false, maxLength: 9 },
            { name: "Shift_Schedule", position: 5, nullable: false, dataType: "varchar", columnType: "varchar(50)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 50 },
            { name: "Date_Assigned", position: 6, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Status", position: 7, nullable: false, dataType: "enum", columnType: "enum('Active','Inactive')", columnDefault: "Active", enumValues: ["Active", "Inactive"], isPrimary: false, maxLength: 8 }
        ]
    },
    officer_term: {
        tableName: "officer_term",
        primaryKey: "Term_ID",
        columnNames: [
            "Term_ID",
            "Member_ID",
            "TODA_ID",
            "Position",
            "Term_Start",
            "Term_End"
        ],
        columns: [
            { name: "Term_ID", position: 1, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: true, maxLength: 10 },
            { name: "Member_ID", position: 2, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 },
            { name: "TODA_ID", position: 3, nullable: false, dataType: "varchar", columnType: "varchar(10)", columnDefault: null, enumValues: null, isPrimary: false, maxLength: 10 },
            { name: "Position", position: 4, nullable: false, dataType: "enum", columnType: "enum('President','Vice President','Secretary','Treasurer','Auditor','Sgt. at Arms','Board of Directors')", columnDefault: null, enumValues: ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "Sgt. at Arms", "Board of Directors"], isPrimary: false, maxLength: 18 },
            { name: "Term_Start", position: 5, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null },
            { name: "Term_End", position: 6, nullable: false, dataType: "date", columnType: "date", columnDefault: null, enumValues: null, isPrimary: false, maxLength: null }
        ]
    }
};

// params: none
function getLocalSchemaClone() {
    const raw = JSON.stringify(TRIDE_LOCAL_SCHEMA);
    const copy = JSON.parse(raw);
    return copy;
}

// params: none
function buildLocalSeedState() {
    // based on final_dbms1_tride_ddl_dml.sql, sample data dml, return exact six table sample dataset
    const federations = [
        { Federation_ID: "FED-01", Federation_Name: "NCFETODA INC.", Accreditation_Number: "SP-RES-2026-601", Accreditation_Expiry: "2029-08-28", Office_Address: "Magsaysay Ave., Naga City", Secretary_Member_ID: "MEM-001" },
        { Federation_ID: "FED-02", Federation_Name: "Naga Upland TODA Federation", Accreditation_Number: "SP-RES-2026-610", Accreditation_Expiry: "2029-09-15", Office_Address: "Brgy. Pacol, Naga City", Secretary_Member_ID: null },
        { Federation_ID: "FED-03", Federation_Name: "Centro Trimobile Federation", Accreditation_Number: "SP-RES-2026-615", Accreditation_Expiry: "2029-10-01", Office_Address: "P. Burgos St., Naga City", Secretary_Member_ID: null },
        { Federation_ID: "FED-04", Federation_Name: "South Naga Transport Federation", Accreditation_Number: "SP-RES-2026-620", Accreditation_Expiry: "2029-10-12", Office_Address: "Brgy. Mabolo, Naga City", Secretary_Member_ID: null },
        { Federation_ID: "FED-05", Federation_Name: "East District TODA Federation", Accreditation_Number: "SP-RES-2026-625", Accreditation_Expiry: "2029-11-05", Office_Address: "Brgy. Cararayan, Naga City", Secretary_Member_ID: null }
    ];

    const todas = [
        { TODA_ID: "TODA-01", TODA_Name: "Mabolo TODA", Route: "Mabolo - Centro", SEC_Reg_Number: "SEC-CN202100101", Terminal_Location: "SM City Naga Terminal", Accreditation_Expiry: "2029-06-30", Association_Status: "Active", Federation_ID: "FED-01" },
        { TODA_ID: "TODA-02", TODA_Name: "Pacol TODA", Route: "Pacol - Centro", SEC_Reg_Number: "SEC-CN202100102", Terminal_Location: "Pacol Barangay Hall Terminal", Accreditation_Expiry: "2029-07-15", Association_Status: "Active", Federation_ID: "FED-01" },
        { TODA_ID: "TODA-03", TODA_Name: "Cararayan TODA", Route: "Cararayan - Centro", SEC_Reg_Number: "SEC-CN202100103", Terminal_Location: "Cararayan Junction Terminal", Accreditation_Expiry: "2029-08-20", Association_Status: "Active", Federation_ID: "FED-01" },
        { TODA_ID: "TODA-04", TODA_Name: "Dayangdang TODA", Route: "Dayangdang - Centro", SEC_Reg_Number: "SEC-CN202100104", Terminal_Location: "Dayangdang Market Terminal", Accreditation_Expiry: "2029-05-10", Association_Status: "Active", Federation_ID: "FED-01" },
        { TODA_ID: "TODA-05", TODA_Name: "Concepcion Pequena TODA", Route: "Concepcion - SM Naga", SEC_Reg_Number: "SEC-CN202500105", Terminal_Location: "Concepcion Subdivision Gate", Accreditation_Expiry: "2028-12-01", Association_Status: "Active", Federation_ID: null }
    ];

    const members = [
        { Member_ID: "MEM-001", First_Name: "Juan", Last_Name: "Dela Cruz", Street: "12 Rizal St.", Barangay: "Mabolo", City_Municipality: "Naga City", Contact_Number: "09171234501", License_Number: "E01-19-001122", License_Expiry_Date: "2029-05-31", License_Type: "Professional", Restriction_Code: "1", PSO_ID_Number: "PSO-2026-001", BLS_Cert_ID: "BLS-2026-001", TODA_ID: "TODA-01" },
        { Member_ID: "MEM-002", First_Name: "Maria", Last_Name: "Santos", Street: "45 Penafrancia Ave.", Barangay: "Mabolo", City_Municipality: "Naga City", Contact_Number: "09171234502", License_Number: null, License_Expiry_Date: null, License_Type: null, Restriction_Code: null, PSO_ID_Number: null, BLS_Cert_ID: null, TODA_ID: "TODA-01" },
        { Member_ID: "MEM-003", First_Name: "Pedro", Last_Name: "Reyes", Street: "88 Zone 3", Barangay: "Mabolo", City_Municipality: "Naga City", Contact_Number: "09171234503", License_Number: "E01-20-003344", License_Expiry_Date: "2030-08-31", License_Type: "Professional", Restriction_Code: "1", PSO_ID_Number: "PSO-2026-003", BLS_Cert_ID: "BLS-2026-003", TODA_ID: "TODA-01" },
        { Member_ID: "MEM-004", First_Name: "Elena", Last_Name: "Bautista", Street: "19 Zone 1", Barangay: "Mabolo", City_Municipality: "Naga City", Contact_Number: "09171234504", License_Number: "E01-21-005566", License_Expiry_Date: "2031-03-31", License_Type: "Professional", Restriction_Code: "1", PSO_ID_Number: "PSO-2026-004", BLS_Cert_ID: "BLS-2026-004", TODA_ID: "TODA-01" },
        { Member_ID: "MEM-005", First_Name: "Carlos", Last_Name: "Mendoza", Street: "77 Elias Angeles St.", Barangay: "Pacol", City_Municipality: "Naga City", Contact_Number: "09171234505", License_Number: "E01-22-007788", License_Expiry_Date: "2027-11-30", License_Type: "Professional", Restriction_Code: "1", PSO_ID_Number: "PSO-2026-005", BLS_Cert_ID: "BLS-2026-005", TODA_ID: "TODA-02" },
        { Member_ID: "MEM-006", First_Name: "Ramon", Last_Name: "Villanueva", Street: "30 Panganiban Dr.", Barangay: "Cararayan", City_Municipality: "Naga City", Contact_Number: "09171234506", License_Number: "E01-23-009900", License_Expiry_Date: "2028-04-30", License_Type: "Professional", Restriction_Code: "1", PSO_ID_Number: "PSO-2026-006", BLS_Cert_ID: "BLS-2026-006", TODA_ID: "TODA-03" }
    ];

    const tricycles = [
        { Tricycle_ID: "TRI-001", Body_Number: "0224", Franchise_Number: "FRAN-2024-0224", Chassis_Number: "CHS-TMX-1001", Plate_Number: "EAB-1001", Franchise_Expiry_Date: "2027-05-15", Mayors_Permit_Expiry: "2026-12-31", Franchise_Status: "Active", OR_CR_Expiry: "2027-05-15", Color_Zone: "Blue", Owner_Member_ID: "MEM-001" },
        { Tricycle_ID: "TRI-002", Body_Number: "0225", Franchise_Number: "FRAN-2024-0225", Chassis_Number: "CHS-TMX-1002", Plate_Number: "EAB-1002", Franchise_Expiry_Date: "2027-06-20", Mayors_Permit_Expiry: "2026-12-31", Franchise_Status: "Active", OR_CR_Expiry: "2027-06-20", Color_Zone: "Blue", Owner_Member_ID: "MEM-002" },
        { Tricycle_ID: "TRI-003", Body_Number: "0226", Franchise_Number: "FRAN-2024-0226", Chassis_Number: "CHS-TMX-1003", Plate_Number: "EAB-1003", Franchise_Expiry_Date: "2027-06-20", Mayors_Permit_Expiry: "2026-12-31", Franchise_Status: "Active", OR_CR_Expiry: "2027-06-20", Color_Zone: "Blue", Owner_Member_ID: "MEM-002" },
        { Tricycle_ID: "TRI-004", Body_Number: "013-STF", Franchise_Number: "FRAN-2025-0013", Chassis_Number: "CHS-BAR-2004", Plate_Number: "EAB-2004", Franchise_Expiry_Date: "2028-03-10", Mayors_Permit_Expiry: "2026-12-31", Franchise_Status: "Active", OR_CR_Expiry: "2027-03-10", Color_Zone: "STF-Blue", Owner_Member_ID: "MEM-005" },
        { Tricycle_ID: "TRI-005", Body_Number: "037-STF", Franchise_Number: "FRAN-2025-0037", Chassis_Number: "CHS-BAR-2005", Plate_Number: "EAB-2005", Franchise_Expiry_Date: "2026-10-01", Mayors_Permit_Expiry: "2026-10-01", Franchise_Status: "Expired", OR_CR_Expiry: "2026-10-01", Color_Zone: "STF-White", Owner_Member_ID: "MEM-006" }
    ];

    const driverAssignments = [
        { Assignment_ID: "ASN-01", Member_ID: "MEM-001", Tricycle_ID: "TRI-001", Driver_Role: "Primary", Shift_Schedule: "Mon-Sat 06:00-18:00", Date_Assigned: "2026-01-10", Status: "Active" },
        { Assignment_ID: "ASN-02", Member_ID: "MEM-003", Tricycle_ID: "TRI-002", Driver_Role: "Primary", Shift_Schedule: "Mon-Fri 06:00-18:00", Date_Assigned: "2026-02-01", Status: "Active" },
        { Assignment_ID: "ASN-03", Member_ID: "MEM-004", Tricycle_ID: "TRI-002", Driver_Role: "Alternate", Shift_Schedule: "Sat-Sun 06:00-18:00", Date_Assigned: "2026-02-05", Status: "Active" },
        { Assignment_ID: "ASN-04", Member_ID: "MEM-005", Tricycle_ID: "TRI-004", Driver_Role: "Primary", Shift_Schedule: "Mon-Sat 05:30-17:30", Date_Assigned: "2026-03-12", Status: "Active" },
        { Assignment_ID: "ASN-05", Member_ID: "MEM-006", Tricycle_ID: "TRI-005", Driver_Role: "Primary", Shift_Schedule: "Mon-Fri 06:00-16:00", Date_Assigned: "2025-10-01", Status: "Inactive" }
    ];

    const officerTerms = [
        { Term_ID: "TERM-01", Member_ID: "MEM-001", TODA_ID: "TODA-01", Position: "President", Term_Start: "2025-01-01", Term_End: "2026-12-31" },
        { Term_ID: "TERM-02", Member_ID: "MEM-002", TODA_ID: "TODA-01", Position: "Treasurer", Term_Start: "2025-01-01", Term_End: "2026-12-31" },
        { Term_ID: "TERM-03", Member_ID: "MEM-003", TODA_ID: "TODA-01", Position: "Secretary", Term_Start: "2025-01-01", Term_End: "2026-12-31" },
        { Term_ID: "TERM-04", Member_ID: "MEM-005", TODA_ID: "TODA-02", Position: "President", Term_Start: "2025-06-01", Term_End: "2027-05-31" },
        { Term_ID: "TERM-05", Member_ID: "MEM-006", TODA_ID: "TODA-03", Position: "President", Term_Start: "2026-01-01", Term_End: "2027-12-31" }
    ];

    return {
        federations: federations,
        todas: todas,
        members: members,
        tricycles: tricycles,
        driver_assignments: driverAssignments,
        officer_terms: officerTerms
    };
}
