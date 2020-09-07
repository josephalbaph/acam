// Copyright (c) 2020, Joseph Marie Alba and contributors
// For license information, please see license.txt
frappe.ui.form.on('Acam Factor', {
    setup: function (frm) {
        field_names.forEach((field_name) => frappe.ui.form.on('Acam Factor', field_name, (frm) => compute_check_factors(frm)))
    }, 
    validate: function (frm) {
        compute_check_factors(frm)
        if (frm.doc.check_factors && frm.doc.check_factors != 100)
            frappe.throw(__("Please ensure Check Factor is 100"));
    }
})

var field_names = [
    "distribution_services",
    "distribution_connection_services",
    "regulated_retail_services",
    "non_regulated_retail_services",
    "supplier_of_last_resort",
    "wholesale_aggregator",
    "related_business",
    "generation",
    "supply_services",
    "general_purpose"
]

var compute_check_factors = (frm) => {
    field_names.forEach((field_name) => (frm.doc[field_name] = frm.doc[field_name] ? flt(frm.doc[field_name]) : 0.000))
    frm.doc.check_factors = field_names.map(field_name => frm.doc[field_name]).reduce((total, value) => total + value)
    frm.refresh_field(field_names)
    frm.refresh_field('check_factors')
}
