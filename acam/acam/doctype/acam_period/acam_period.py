# -*- coding: utf-8 -*-
# Copyright (c) 2020, Joseph Marie Alba and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
import json
import erpnext
from frappe.utils import flt
from frappe.utils.data import get_first_day, get_last_day
from frappe.model.document import Document
from erpnext.accounts.report.utils import get_currency, convert_to_presentation_currency
from erpnext.accounts.doctype.account.account import get_account_currency

class AcamPeriod(Document):
	acam_fields = [
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

	def validate(self):
		self.set_dates()
		self.set_acam_period_factor()
		self.set_acam_period_account()
		self.set_acam_period_account_amount()
		self.set_acam_period_account_factor()
		self.set_check_amount()

	def set_dates(self):
		self.from_date = get_first_day(self.from_date)
		self.to_date = get_last_day(self.from_date)

	def set_acam_period_factor(self):
		if not self.acam_period_factor:
			acam_factor_list = get_acam_factor(self.company)
			for acam_factor in acam_factor_list:
				row = self.append("acam_period_factor",{acam_field: acam_factor.get(acam_field) for acam_field in self.acam_fields})
				row.acam_factor = acam_factor.name
				row.check_factors = acam_factor.check_factors

	def set_acam_period_account(self):
		if not self.acam_period_account:
			acam_account_list = get_acam_account_factor(self.company)
			for acam_account in acam_account_list:
				row = self.append("acam_period_account",{ acam_field: 0 for acam_field in self.acam_fields })
				row.account = acam_account.account
				row.acam_factor = acam_account.acam_factor
				row.sequence = acam_account.sequence
				row.amount = 0
				row.check_amount = 0		

	def set_acam_period_account_amount(self):
		if self.acam_period_account:
			filters = {
					'from_date': self.from_date,
					'to_date': self.to_date,
					'company': self.company,
					'account': ''
				}
			for acc in self.acam_period_account:
				filters['account'] = acc.account
				acc.amount = flt(get_account_period_amount(filters))
				acc.check_amount = 0.00

	def set_acam_period_account_factor(self):
		# distribute account total to acam factors
		if self.acam_period_account and self.acam_period_factor:
			acam_factor_dict = {acam_factor.get('acam_factor'): acam_factor for acam_factor in self.acam_period_factor}
			# accounts = frm.acam_period_account
			for acc in self.acam_period_account:
				if acc.acam_factor is None:
					acc = { acam_field: 0 for acam_field in self.acam_fields}
					# for acam_field in acam_fields:
					# 	acc.acam_field = 0.00			
				else:
					acam_factor = acam_factor_dict[acc.acam_factor]
					_amount = acc.amount
					for acam_field in self.acam_fields:
						acc.set(acam_field, flt(_amount) * flt(acam_factor.get(acam_field)) * 0.01)

	def set_check_amount(self):
		# check total amounts of acam factors
		if self.acam_period_account:
			for acc in self.acam_period_account:
				acc.check_amount = 0
				for acam_field in self.acam_fields:
					acc.check_amount += acc.get(acam_field)

def solve_period_account():
	pass

@frappe.whitelist()
def get_acam_factor(company):
	return frappe.db.get_list('Acam Factor',
							  filters={
								  'company': company
							  },
							  fields=['name', 'distribution_services', 'distribution_connection_services',
									  'regulated_retail_services', 'non_regulated_retail_services', 'supplier_of_last_resort',
									  'wholesale_aggregator', 'related_business', 'generation', 'supply_services', 'general_purpose',
									  'check_factors', 'sequence'
									  ],
							  order_by='sequence'
							  )

@frappe.whitelist()
def get_acam_account_factor(company):
	return frappe.db.get_list('Acam Account Factor',
							  filters={
								  'company': company
							  },
							  fields=['account', 'acam_factor', 'sequence'
									  ],
							  order_by='account'
							  )

@frappe.whitelist()
def get_account_period_amount(filters=None):
	if not isinstance(filters, dict):
		filters = json.loads(filters)
	filters = set_account_currency(filters)
	gl_sum = get_gl_sum(filters)
	return flt(gl_sum[0].debit) - flt(gl_sum[0].credit)


def get_gl_sum(filters):
	conditions_statement = get_conditions(filters)
	gl_sum = frappe.db.sql(
		"""
		select
			sum(debit) as debit, sum(credit) as credit 
		from `tabGL Entry`
		where company=%(company)s {conditions}
		""".format(
			conditions=conditions_statement
		), filters, as_dict=1)
	return gl_sum


def set_account_currency(filters):
	filters["company_currency"] = frappe.get_cached_value(
		'Company',  filters["company"],  "default_currency")
	account_currency = None

	if filters.get("account"):
		account_currency = get_account_currency(filters["account"])
	filters["account_currency"] = account_currency or filters["company_currency"]
	return filters


def get_conditions(filters):
	conditions = []
	lft, rgt = frappe.db.get_value("Account", filters["account"], ["lft", "rgt"])
	conditions.append("""account in (select name from tabAccount
			where lft>=%s and rgt<=%s and docstatus<2)""" % (lft, rgt))
	conditions.append("(posting_date <=%(to_date)s or is_opening = 'Yes')")
	conditions.append("is_cancelled = 0")
	return "and {}".format(" and ".join(conditions)) if conditions else ""
