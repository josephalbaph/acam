# -*- coding: utf-8 -*-
# Copyright (c) 2020, Joseph Marie Alba and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class AcamPeriod(Document):
	pass


@frappe.whitelist()
def get_acam_factor(company):
	return frappe.db.get_list('Acam Factor',
	    filters={
    	    'company': company
    	},
		fields = ['name', 'distribution_services', 'distribution_connection_services',
		  'regulated_retail_services', 'non_regulated_retail_services', 'supplier_of_last_resort', 
		  'wholesale_aggregator', 'related_business', 'generation', 'supply_services', 'general_purpose', 
		  'check_factors', 'sequence'
		],
        order_by='sequence'
	)
