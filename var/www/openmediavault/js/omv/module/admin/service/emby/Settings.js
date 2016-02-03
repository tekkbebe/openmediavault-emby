/**
 * Copyright (C) 2014-2015 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")

Ext.define("OMV.module.admin.service.emby.Settings", {
    extend : "OMV.workspace.form.Panel",

    rpcService   : "Emby",
    rpcGetMethod : "getSettings",
    rpcSetMethod : "setSettings",

    plugins      : [{
        ptype        : "linkedfields",
        correlations : [{
            name        : [
              "enable"
            ],
            conditions  : [
                { name : "enable", value : true }
            ],
            properties : function(valid, field) {
                this.setButtonDisabled("restart", !valid);
                this.setButtonDisabled("webclient", !valid);
            }
        }]
    }],

    initComponent : function () {
        var me = this;

        me.on('load', function () {
            var checked = me.findField('enable').checked;
            var showtab = me.findField('showtab').checked;
            var parent = me.up('tabpanel');

            if (!parent)
                return;

            var webClientPanel = parent.down('panel[title=' + _("Web Client") + ']');

            if (webClientPanel) {
                checked ? webClientPanel.enable() : webClientPanel.disable();
                showtab ? webClientPanel.tab.show() : webClientPanel.tab.hide();
            }
        });
        me.callParent(arguments);
    },

    getButtonItems : function() {
        var me = this;
        var items = me.callParent(arguments);
        items.push({
            id       : me.getId() + "-restart",
            xtype    : "button",
            text     : _("Restart"),
            icon     : "images/reboot.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled : true,
            scope    : me,
            handler  : function() {
                // Execute RPC.
                OMV.Rpc.request({
                    scope       : this,
                    callback    : function(id, success, response) {
                        this.doRestart();
                    },
                    relayErrors : false,
                    rpcData     : {
                        service  : "Emby",
                        method   : "doRestart"
                    }
                });
            }
        },{
            id       : me.getId() + "-webclient",
            xtype    : "button",
            text     : _("Emby Web Client"),
            icon     : "images/emby.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            disabled : true,
            scope    : me,
            handler  : function() {
				var link = 'http://' + location.hostname + ':8096/emby';
				window.open(link, '_blank');
            }
        });
        return items;
    },

    getFormItems : function() {
        return [{
            xtype    : "fieldset",
            title    : _("General settings"),
            defaults : {
                labelSeparator : ""
            },
            items    : [{
                xtype      : "checkbox",
                name       : "enable",
                fieldLabel : _("Enable"),
                checked    : false
            },{
                xtype         : "combo",
                name          : "mntentref",
                fieldLabel    : _("Database Volume"),
                emptyText     : _("Select a volume ..."),
                allowBlank    : true,
                allowNone     : true,
                editable      : false,
                triggerAction : "all",
                displayField  : "description",
                valueField    : "uuid",
                store         : Ext.create("OMV.data.Store", {
                    autoLoad : true,
                    model    : OMV.data.Model.createImplicit({
                        idProperty : "uuid",
                        fields     : [
                            { name  : "uuid", type : "string" },
                            { name  : "devicefile", type : "string" },
                            { name  : "description", type : "string" }
                        ]
                    }),
                    proxy    : {
                        type    : "rpc",
                        rpcData : {
                            service : "ShareMgmt",
                            method  : "getCandidates"
                        },
                        appendSortParams : false
                    },
                    sorters  : [{
                        direction: "ASC",
                        property: "devicefile"
                    }]
                }),
                plugins : [{
                    ptype : "fieldinfo",
                    text  : _("Database files will move to new location if database volume is changed.")
                }]
            },{
                xtype      : "textfield",
                name       : "db-folder",
                fieldLabel : _("Database Folder"),
                allowNone  : true,
                readOnly   : true
            },{
                xtype      : "checkbox",
                name       : "showtab",
                fieldLabel : _("Show Client"),
                boxLabel   : _("Show tab containing Web Client frame."),
                checked    : false
            },{
                xtype      : "button",
                name       : "update",
                id         : this.getId() + "-update",
                text       : _("Force update"),
                scope      : this,
                margin     : "0 0 5 0",
                handler    : Ext.Function.bind(this.onUpdate, this, [ this ])
            }]
        },{
            xtype   : "fieldset",
            title   : _("Information"),
            layout  : "fit",
            items : [{
                border  : false,
                html    : '<b>Notes</b>:' +
                          '<ol>' +
                          '<li>' +
                          'After enabling the server you have to go through a first time setup wizard.  Skip the section where it offers to setup media shares.  Once setup is complete this can easily be done via the <b>Home / Manage Server / Library</b> section.' +
                          '</li>' +
                          '<li>' +
                          'To enable the iframe in the <b>Web Client</b> panel you need to edit this file <b>/media/UUID/emby/config/system.xml</b>.  Scroll down to almost the of end of the file and edit the <b>DenyIFrameEmbedding</b> setting so it says <b>false</b>.  Then save and exit.' +
                          '</li>' +
                          '<li>' +
                          '<b>** Warning **</b> <b>Do not</b> use the <b>Shutdown button</b> in the Manage Server section.  You can use any of the Restart buttons in the Emby UI.' +
                          '</li>' +
                          '<li>' +
                          '<b>** Warning **</b> Allowing Emby to write metadata to your media folders may not be desired.  To enable this feature run the following command: <b>usermod -a -G users emby</b>' +
                          '</li>' +
                          '</ol>' +
                          '<h3>OMV Firewall</h3>' +
                          'If you are using OMVs firewall create rules to open the following ports on your LAN.' +
                          '<ul>' +
                          '<li>' +
                          '<b>TCP 8096</b> HTTP access to the Emby UI. Required for Windows Media Player.' +
                          '</li>' +
                          '<li>' +
                          '<b>TCP 8920</b> HTTPS access to the Emby UI.' +
                          '</li>' +
                          '<li>' +
                          '<b>TCP 8945</b> Port used for data transfer.' +
                          '</li>' +
                          '</ul>' +
                          '<h3>Router Settings</h3>' +
                          'Ports to be forwarded from your router to your OMV for remote client connections or secure browser sessions, via HTTPS, to manage the server.' +
                          '<ul>' +
                          '<li>' +
                          '<b>TCP 8096</b> To connect with Plex Connect or direct client connections.' +
                          '</li>' +
                          '<li>' +
                          '<b>TCP 8920</b> Secure connection to Manage Server.' +
                          '</li>' +
                          '<li>' +
                          '<b>TCP 8945</b> For data transfer.' +
                          '</li>' +
                          '</ul>' +
                          '<h3>Emby Connect and Client Software</h3>' +
                          '<ul>' +
                          '<li>' +
                          'Create an <b>Emby Connect</b> account <a href="http://app.emby.media/connectlogin.html" target="_blank">here</a>. Emby Connect can be used to view your server remotely.  Make sure you sign your clients/servers into the account. The account is also used to sign into the <a href="http://emby.media/community/" target="_blank">forums</a> for <b>support</b>.' +
                          '</li>' +
                          '<li>' +
                          'Emby has <b>client software</b> availabe for <b>Android</b>, <b>Windows RT/PC</b>, <b>Amazon Fire TV</b> and <b>iOS</b> is coming soon.' +
                          '</li>' +
                          '</ul>'
            }]
        }];
    },

    onUpdate : function() {
        Ext.create("OMV.window.Execute", {
            title          : _("Click start to force update..."),
            rpcService     : "Emby",
            rpcMethod      : "doUpdate",
            hideStopButton : true,
            listeners      : {
                exception  : function(wnd, error) { OMV.MessageBox.error(null, error);}
            }
        }).show();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "settings",
    path      : "/service/emby",
    text      : _("Settings"),
    position  : 10,
    className : "OMV.module.admin.service.emby.Settings"
});
