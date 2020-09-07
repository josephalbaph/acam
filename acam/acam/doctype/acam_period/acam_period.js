// Copyright (c) 2020, Joseph Marie Alba and contributors
// For license information, please see license.txt

frappe.ui.form.on('Acam Period', {
	
	refresh: function (frm) {
		frm.add_custom_button(__('Default Acam Factors'), function () {
			return frappe.call({
				type: "GET",
				method: "acam.acam.doctype.acam_period.acam_period.get_acam_factor",
				args: {
					"company": frm.doc.company
				},
				callback: function (r) {
					debugger
					frappe.model.clear_table(frm.doc, "acam_period_factor");
					if (r.message) {
						update_acam_period_factor(frm.doc, r.message);
					}
				}
			});    
		});
    },
    start_date: function (frm) {
        debugger
        frm.doc.start_date = moment(frm.doc.start_date).startOf("month").format()
        frm.doc.end_date = moment(frm.doc.end_date).endOf("month").format()
        frm.doc.acam_month = moment(frm.doc.start_date).format("YYYY MM (MMMM)")
        frm.refresh_field('start_date')
        frm.refresh_field('end_date')
        frm.refresh_field('acam_month')
    }
});

var update_acam_period_factor = function (doc, r) {
	$.each(r, function (i, d) {
		var row = frappe.model.add_child(doc, "Acam Period Factor", "acam_period_factor");
		row.acam_factor = d.name;
		row.distribution_services = d.distribution_services;
		row.distribution_connection_services = d.distribution_connection_services;
		row.regulated_retail_services = d.regulated_retail_services;
		row.non_regulated_retail_services = d.non_regulated_retail_services;
		row.supplier_of_last_resort = d.supplier_of_last_resort;
		row.wholesale_aggregator = d.wholesale_aggregator;
		row.related_business = d.related_business;
		row.generation = d.generation;
		row.supply_services = d.supply_services;
		row.general_purpose = d.general_purpose;
		row.check_factors = d.check_factors;
	});
	refresh_field("acam_period_factor");
}

frappe.ui.form.on("Acam Period Factor", {
    validate: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    distribution_services: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    distribution_connection_services: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    regulated_retail_services: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    non_regulated_retail_services: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    supplier_of_last_resort: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    wholesale_aggregator: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    related_business: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    generation: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    supply_services: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn),
    general_purpose: (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn)
})

var compute_check_factors = function (frm, cdt, cdn) {
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
    debugger
    let row = locals[cdt][cdn]
    field_names.forEach((field_name) => (row[field_name] = row[field_name] ? flt(row[field_name]) : 0.000))
    row.check_factors = field_names.map(field_name => row[field_name]).reduce((total, value) => total + value)
    cur_frm.cur_grid.refresh_field(field_names)
    cur_frm.cur_grid.refresh_field('check_factors')
}
