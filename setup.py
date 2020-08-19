# -*- coding: utf-8 -*-
from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in acam/__init__.py
from acam import __version__ as version

setup(
	name='acam',
	version=version,
	description='ERC Accounting and Cost Allocation Manual',
	author='Joseph Marie Alba',
	author_email='josephalbaph@gmail.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
