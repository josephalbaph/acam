# -*- coding: utf-8 -*-
# Copyright (c) 2020, Joseph Marie Alba and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from frappe.utils import flt

class AcamFactor(Document):

	def validate(self):
		self.validate_check_factor(); 

	def validate_check_factor(self):
		self.check_factors = flt(self.distribution_services)+flt(self.distribution_connection_services) \
			+flt(self.regulated_retail_services)+flt(self.non_regulated_retail_services)+flt(self.supplier_of_last_resort) \
			+flt(self.wholesale_aggregator)+flt(self.related_business)+flt(self.generation)+flt(self.supply_services)+flt(self.general_purpose);