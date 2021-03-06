// Copyright (c) 2020, Joseph Marie Alba and contributors
// For license information, please see license.txt

frappe.ui.form.on('Acam Period', {
    setup: function (frm) {
        acam_fields.forEach((field_name) => frappe.ui.form.on('Acam Period Factor', field_name, (frm, cdt, cdn) => compute_check_factors(frm, cdt, cdn)))
    }, 
    refresh: function (frm) {
        frm.toggle_enable('from_date', frm.is_new()); 
    },
    from_date: function (frm) {
        frm.doc.from_date = moment(frm.doc.from_date).startOf("month").format()
        frm.doc.to_date = moment(frm.doc.from_date).endOf("month").format()
        frm.doc.title = moment(frm.doc.to_date).format("YYYY-MM MMMM DD, YYYY")
        frm.refresh_field(['from_date', 'to_date', 'title'])
    }
});

frappe.ui.form.on("Acam Period Factor", {
    form_close: function (frm, cdt, cdn) {
        compute_check_factors(frm, cdt, cdn)
        let row = locals[cdt][cdn]
        if (row.check_factors && row.check_factors != 100)
            frappe.throw(__("Please ensure Check Factor is 100"));
    },
})

frappe.ui.form.on("Acam Period Account", {
    amount: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]
        let e = Object.entries(locals['Acam Period Factor'])
                    .filter( i => i[1].acam_factor == row.acam_factor)[0][1]
        acam_fields.forEach(
            acam_field => row[acam_field] = flt(row['amount']) * 0.01 * flt(e[acam_field])) 
        acam_fields.forEach(
            acam_field => cur_frm.cur_grid.refresh_field(acam_field))
    },
    get_amount: (frm, cdt, cdn) => account_get_amount(frm, cdt, cdn)
})

var acam_fields = [
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

var update_acam_period_factor = function (doc, r) {
	$.each(r, function (i, d) {
		var row = frappe.model.add_child(doc, "Acam Period Factor", "acam_period_factor");
        row.acam_factor = d.name;
        acam_fields.forEach((acam_field) => row[acam_field] = d[acam_field])
		row.check_factors = d.check_factors;
	});
	refresh_field("acam_period_factor");
}

var update_acam_period_account = function (frm, r) {
    $.each(r, function (i, d) {
        var row = frappe.model.add_child(frm.doc, "Acam Period Account", "acam_period_account");
        row.account = d.account;
        row.acam_factor = d.acam_factor
        row.sequence = d.sequence
        
        acam_fields.forEach((acam_field) => row[acam_field] = 0.000);

    //     // row.check_factors = d.check_factors;
    });
    refresh_field("acam_period_account");
}

var compute_check_factors = function (frm, cdt, cdn) {
    let row = locals[cdt][cdn]
    acam_fields.forEach((field_name) => (row[field_name] = row[field_name] ? flt(row[field_name]) : 0.000))
    row.check_factors = acam_fields.map(field_name => row[field_name]).reduce((total, value) => total + value)
    cur_frm.cur_grid.refresh_field(acam_fields)
    cur_frm.cur_grid.refresh_field('check_factors')
}

var account_get_amount = function (frm, cdt, cdn) {
    let row = locals[cdt][cdn]
    let filters = {
        'from_date': frm.doc.from_date,
        'to_date': frm.doc.to_date,
        'company': frm.doc.company,
        'account': row['account']
    }
    frappe.call({
        type: "GET",
        method: "acam.acam.doctype.acam_period.acam_period.get_account_period_amount",
        args: {
            "filters": filters
        },
        callback: function (r) {
            if (r.message) {
                account_amount = flt(r.message)
                row['amount'] = account_amount
            }
        }
    })
}

